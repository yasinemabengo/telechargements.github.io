from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QListWidget, QFileDialog, QLabel, QSlider, QMessageBox, QAbstractItemView, QGroupBox, QCheckBox
)
from PyQt6.QtCore import Qt, QUrl, QThread, pyqtSignal
from PyQt6.QtMultimedia import QMediaPlayer, QAudioOutput
import sys
import os
import tempfile

# Attempt to import pydub for equalizer processing
try:
    from pydub import AudioSegment
    HAVE_PYDUB = True
except Exception:
    HAVE_PYDUB = False


class DropListWidget(QListWidget):
    """QListWidget qui accepte les fichiers déposés (drag & drop)."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAcceptDrops(True)
        try:
            # show drop indicator and prefer copy action
            self.setDropIndicatorShown(True)
            self.setDefaultDropAction(Qt.DropAction.CopyAction)
            # accept drops only
            self.setDragDropMode(QAbstractItemView.DragDropMode.DropOnly)
        except Exception:
            pass

    def supportedDropActions(self):
        return Qt.DropAction.CopyAction

    def dragEnterEvent(self, event):
        md = event.mimeData()
        if md.hasUrls():
            try:
                event.setDropAction(Qt.DropAction.CopyAction)
            except Exception:
                pass
            event.acceptProposedAction()
        else:
            super().dragEnterEvent(event)

    def dragMoveEvent(self, event):
        md = event.mimeData()
        if md.hasUrls():
            try:
                event.setDropAction(Qt.DropAction.CopyAction)
            except Exception:
                pass
            event.acceptProposedAction()
        else:
            super().dragMoveEvent(event)

    def dropEvent(self, event):
        md = event.mimeData()
        if md.hasUrls():
            urls = md.urls()
            paths = []
            for u in urls:
                if u.isLocalFile():
                    paths.append(u.toLocalFile())
            # appeler la méthode du top-level window s'il existe
            top = self.window()
            if hasattr(top, 'add_paths'):
                top.add_paths(paths)
            else:
                parent = self.parent()
                if hasattr(parent, 'add_paths'):
                    parent.add_paths(paths)
            try:
                event.setDropAction(Qt.DropAction.CopyAction)
            except Exception:
                pass
            event.acceptProposedAction()
        else:
            super().dropEvent(event)


# DropLabel: QLabel that accepts a single file drop and notifies parent with load_deck_path
class DropLabel(QLabel):
    def __init__(self, text='', parent=None, deck=None):
        super().__init__(text, parent)
        self.deck = deck
        self.setAcceptDrops(True)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setStyleSheet('padding:6px;')

    def dragEnterEvent(self, event):
        md = event.mimeData()
        if md.hasUrls():
            event.acceptProposedAction()
        else:
            super().dragEnterEvent(event)

    def dropEvent(self, event):
        md = event.mimeData()
        if md.hasUrls():
            urls = md.urls()
            # take first local file
            for u in urls:
                if u.isLocalFile():
                    path = u.toLocalFile()
                    top = self.window()
                    if hasattr(top, 'load_deck_path'):
                        top.load_deck_path(self.deck, path)
                    break
            event.acceptProposedAction()
        else:
            super().dropEvent(event)


class EQWorker(QThread):
    finished = pyqtSignal(str, str)  # (result_path, deck)

    def __init__(self, src_path, bass_db, mid_db, treble_db, deck='A'):
        super().__init__()
        self.src_path = src_path
        self.bass_db = bass_db
        self.mid_db = mid_db
        self.treble_db = treble_db
        self.deck = deck

    def run(self):
        try:
            print(f'[EQWorker] start deck={self.deck} src={self.src_path}')
            if not HAVE_PYDUB:
                # pydub not available — emit original path
                print('[EQWorker] pydub missing, skipping')
                self.finished.emit(self.src_path, self.deck)
                return
            seg = AudioSegment.from_file(self.src_path)
            bass = seg.low_pass_filter(250).apply_gain(self.bass_db)
            mid = seg.high_pass_filter(250).low_pass_filter(4000).apply_gain(self.mid_db)
            treble = seg.high_pass_filter(4000).apply_gain(self.treble_db)
            out = seg.overlay(bass)
            out = out.overlay(mid)
            out = out.overlay(treble)
            tf = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            out.export(tf.name, format='wav')
            tf.close()
            print(f'[EQWorker] finished deck={self.deck} out={tf.name}')
            self.finished.emit(tf.name, self.deck)
        except Exception as e:
            print('EQWorker error:', e)
            # fallback
            self.finished.emit(self.src_path, self.deck)


class LecteurMusique(QMainWindow):
    """Lecteur de musique avec mixeur 2 decks et égaliseur basique (pydub requise pour traitement EQ)."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle('Lecteur de musique - Mixeur & Égaliseur')
        self.resize(1100, 640)

        # state
        self.playlist = []
        self.current_index = -1
        self._temp_files = []
        self._eq_jobs = {}

        # players
        self.playerA = QMediaPlayer()
        self.audioA = QAudioOutput()
        self.playerA.setAudioOutput(self.audioA)
        self.playerB = QMediaPlayer()
        self.audioB = QAudioOutput()
        self.playerB.setAudioOutput(self.audioB)

        self.build_ui()
        self.apply_styles()
        self.connect_signals()

    def build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main = QVBoxLayout(); central.setLayout(main)

        # Mixer area
        mixer_box = QGroupBox('Mixeur')
        mixer_layout = QHBoxLayout(); mixer_box.setLayout(mixer_layout)

        # Deck A
        deckA = QGroupBox('Deck A')
        dA = QVBoxLayout(); deckA.setLayout(dA)
        self.btn_load_A = QPushButton('Charger A')
        self.lbl_A = DropLabel('Aucun', parent=self, deck='A')
        self.chk_bypass_A = QCheckBox('Bypass EQ'); self.chk_bypass_A.setChecked(True)
        self.btn_preproc_A = QPushButton('Prétraiter EQ')
        self.btn_play_A = QPushButton('▶ A'); self.btn_pause_A = QPushButton('⏸ A'); self.btn_stop_A = QPushButton('⏹ A')
        self.chk_apply_eq_A = QCheckBox('Apply EQ on play'); self.chk_apply_eq_A.setChecked(False)
        self.gainA = QSlider(Qt.Orientation.Horizontal); self.gainA.setRange(-20,20); self.gainA.setValue(0)
        dA.addWidget(self.btn_load_A); dA.addWidget(self.lbl_A); dA.addWidget(self.chk_bypass_A); dA.addWidget(self.btn_preproc_A)
        hA = QHBoxLayout(); hA.addWidget(self.btn_play_A); hA.addWidget(self.btn_pause_A); hA.addWidget(self.btn_stop_A); dA.addLayout(hA)
        dA.addWidget(self.chk_apply_eq_A); dA.addWidget(QLabel('Gain A (dB)')); dA.addWidget(self.gainA)

        # Crossfade
        cf = QGroupBox('Crossfade'); cfl = QVBoxLayout(); cf.setLayout(cfl)
        self.crossfade = QSlider(Qt.Orientation.Vertical); self.crossfade.setRange(0,100); self.crossfade.setValue(50)
        self.crossfade.setToolTip('Crossfade A <-> B (0=A,100=B)'); cfl.addWidget(self.crossfade)

        # Deck B
        deckB = QGroupBox('Deck B')
        dB = QVBoxLayout(); deckB.setLayout(dB)
        self.btn_load_B = QPushButton('Charger B')
        self.lbl_B = DropLabel('Aucun', parent=self, deck='B')
        self.chk_bypass_B = QCheckBox('Bypass EQ'); self.chk_bypass_B.setChecked(True)
        self.btn_preproc_B = QPushButton('Prétraiter EQ')
        self.btn_play_B = QPushButton('▶ B'); self.btn_pause_B = QPushButton('⏸ B'); self.btn_stop_B = QPushButton('⏹ B')
        self.chk_apply_eq_B = QCheckBox('Apply EQ on play'); self.chk_apply_eq_B.setChecked(False)
        self.gainB = QSlider(Qt.Orientation.Horizontal); self.gainB.setRange(-20,20); self.gainB.setValue(0)
        dB.addWidget(self.btn_load_B); dB.addWidget(self.lbl_B); dB.addWidget(self.chk_bypass_B); dB.addWidget(self.btn_preproc_B)
        hB = QHBoxLayout(); hB.addWidget(self.btn_play_B); hB.addWidget(self.btn_pause_B); hB.addWidget(self.btn_stop_B); dB.addLayout(hB)
        dB.addWidget(self.chk_apply_eq_B); dB.addWidget(QLabel('Gain B (dB)')); dB.addWidget(self.gainB)

        mixer_layout.addWidget(deckA); mixer_layout.addWidget(cf); mixer_layout.addWidget(deckB)
        main.addWidget(mixer_box)

        # EQ sliders group
        eq_box = QGroupBox('Égaliseur (approx.)'); eq_layout = QHBoxLayout(); eq_box.setLayout(eq_layout)
        eqA_box = QGroupBox('A - EQ (dB)'); eA = QVBoxLayout(); eqA_box.setLayout(eA)
        self.eqA_bass = QSlider(Qt.Orientation.Horizontal); self.eqA_bass.setRange(-12,12); self.eqA_bass.setValue(0)
        self.eqA_mid = QSlider(Qt.Orientation.Horizontal); self.eqA_mid.setRange(-12,12); self.eqA_mid.setValue(0)
        self.eqA_treble = QSlider(Qt.Orientation.Horizontal); self.eqA_treble.setRange(-12,12); self.eqA_treble.setValue(0)
        eA.addWidget(QLabel('Bass')); eA.addWidget(self.eqA_bass); eA.addWidget(QLabel('Mid')); eA.addWidget(self.eqA_mid); eA.addWidget(QLabel('Treble')); eA.addWidget(self.eqA_treble)
        eqB_box = QGroupBox('B - EQ (dB)'); eB = QVBoxLayout(); eqB_box.setLayout(eB)
        self.eqB_bass = QSlider(Qt.Orientation.Horizontal); self.eqB_bass.setRange(-12,12); self.eqB_bass.setValue(0)
        self.eqB_mid = QSlider(Qt.Orientation.Horizontal); self.eqB_mid.setRange(-12,12); self.eqB_mid.setValue(0)
        self.eqB_treble = QSlider(Qt.Orientation.Horizontal); self.eqB_treble.setRange(-12,12); self.eqB_treble.setValue(0)
        eB.addWidget(QLabel('Bass')); eB.addWidget(self.eqB_bass); eB.addWidget(QLabel('Mid')); eB.addWidget(self.eqB_mid); eB.addWidget(QLabel('Treble')); eB.addWidget(self.eqB_treble)
        eq_layout.addWidget(eqA_box); eq_layout.addWidget(eqB_box); main.addWidget(eq_box)

        # Playlist and controls
        top = QHBoxLayout()
        self.list_widget = DropListWidget(self); self.list_widget.setObjectName('dropZone')
        self.list_widget.setToolTip('Liste des morceaux. Double-clique pour jouer.')
        top.addWidget(self.list_widget, 3)
        side = QVBoxLayout(); self.btn_add = QPushButton('Ajouter fichiers'); self.btn_remove = QPushButton('Supprimer sélection')
        side.addWidget(self.btn_add); side.addWidget(self.btn_remove); side.addStretch(); top.addLayout(side,1)
        main.addLayout(top)

        # Global player controls
        ctrls = QHBoxLayout(); self.lbl_now = QLabel('Aucun morceau'); self.lbl_now.setObjectName('nowLabel'); ctrls.addWidget(self.lbl_now,3)
        self.btn_prev = QPushButton('⏮'); self.btn_play = QPushButton('▶️'); self.btn_stop = QPushButton('⏹'); self.btn_next = QPushButton('⏭')
        for b in (self.btn_prev, self.btn_play, self.btn_stop, self.btn_next): b.setToolTip('Contrôle de lecture'); ctrls.addWidget(b,0)
        self.slider = QSlider(Qt.Orientation.Horizontal); self.slider.setRange(0,0); self.slider.setToolTip('Position dans la piste')
        main.addLayout(ctrls); main.addWidget(self.slider)

        vol = QHBoxLayout(); vol.addWidget(QLabel('Volume')); self.vol_slider = QSlider(Qt.Orientation.Horizontal); self.vol_slider.setRange(0,100); self.vol_slider.setValue(80); vol.addWidget(self.vol_slider); main.addLayout(vol)

        hint = QLabel("Égaliseur désactivé par défaut (Bypass). Pour EQ avancé installez pydub+ffmpeg.")
        main.addWidget(hint)

    def apply_styles(self):
        self.setStyleSheet(r"""
            QWidget { background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #071025, stop:1 #071827); color: #e6eef8; font-family: 'Segoe UI', Arial; }
            QGroupBox { border: 1px solid #233447; border-radius: 8px; margin-top: 6px; }
            QGroupBox::title { subcontrol-origin: margin; left:10px; padding:0 3px; }
            QLabel { color: #dff6ff; }
            QLabel#nowLabel { font-size:15px; font-weight:600; color:#fff; }
            /* zone de glisser-déposer (noire) */
            QListWidget#dropZone { background: #000000; color: #ffffff; border:1px solid #213240; border-radius:8px; padding:6px; }
            /* fallback / autres QListWidget */
            QListWidget { background: qlineargradient(x1:0, y1:0, x2=0, y2=1, stop:0 rgba(10,20,30,0.6), stop:1 rgba(5,12,20,0.6)); border:1px solid #213240; border-radius:8px; padding:6px; }
            QListWidget::item { padding:8px 10px; margin:3px 0; border-radius:6px; color:#e6eef8; }
            QListWidget::item:selected { background: qlineargradient(x1:0, y1:0, x2=0, y2=1, stop:0 #1f5a4a, stop:1 #0f3d33); color:#fff; }
            QPushButton { background: qlineargradient(x1:0, y1:0, x2=0, y2=1, stop:0 #2f9f7f, stop:1 #1f7a5f); color:#fff; border-radius:8px; padding:8px 12px; }
            QPushButton:hover { background: qlineargradient(x1:0, y1:0, x2=0, y2=1, stop:0 #46b88f, stop:1 #2aa276); }
            QSlider::groove:horizontal { height:8px; background:#0b2330; border-radius:4px; }
            QSlider::handle:horizontal { background: qlineargradient(x1:0, y1:0, x2=0, y2=1, stop:0 #fff, stop:1 #cfe8ff); border:1px solid #2b6b4f; width:14px; margin:-4px 0; border-radius:7px; }
            QToolTip { background:#0b1620; color:#e6eef8; border:1px solid #233447; padding:6px; border-radius:4px; }
        """)

    def connect_signals(self):
        self.btn_add.clicked.connect(self.add_files)
        self.btn_remove.clicked.connect(self.remove_selected)
        self.list_widget.itemDoubleClicked.connect(self.on_item_double_clicked)

        self.btn_load_A.clicked.connect(lambda: self.load_deck_file('A'))
        self.btn_load_B.clicked.connect(lambda: self.load_deck_file('B'))
        self.btn_play_A.clicked.connect(lambda: self.play_deck('A'))
        self.btn_pause_A.clicked.connect(lambda: self.pause_deck('A'))
        self.btn_stop_A.clicked.connect(lambda: self.stop_deck('A'))
        self.btn_play_B.clicked.connect(lambda: self.play_deck('B'))
        self.btn_pause_B.clicked.connect(lambda: self.pause_deck('B'))
        self.btn_stop_B.clicked.connect(lambda: self.stop_deck('B'))

        self.gainA.valueChanged.connect(lambda v: self.apply_gain('A', v))
        self.gainB.valueChanged.connect(lambda v: self.apply_gain('B', v))
        self.crossfade.valueChanged.connect(self.apply_crossfade)

        self.btn_preproc_A.clicked.connect(lambda: self.preprocess_eq('A'))
        self.btn_preproc_B.clicked.connect(lambda: self.preprocess_eq('B'))

        self.lbl_A.mousePressEvent = lambda ev: self.load_deck_file('A')
        self.lbl_B.mousePressEvent = lambda ev: self.load_deck_file('B')

        self.btn_play.clicked.connect(self.toggle_play)
        self.btn_stop.clicked.connect(self.stop_all)
        self.btn_next.clicked.connect(self.next_track)
        self.btn_prev.clicked.connect(self.prev_track)

        self.vol_slider.valueChanged.connect(self.on_volume_changed)

        # media signals
        self.playerA.positionChanged.connect(self.on_position_changed)
        self.playerA.durationChanged.connect(self.on_duration_changed)
        self.playerA.playbackStateChanged.connect(self.on_state_changed)
        self.playerA.mediaStatusChanged.connect(self.on_media_status_changed)
        self.playerA.errorOccurred.connect(self.on_error)

        self.playerB.positionChanged.connect(self.on_position_changed)
        self.playerB.durationChanged.connect(self.on_duration_changed)
        self.playerB.playbackStateChanged.connect(self.on_state_changed)
        self.playerB.mediaStatusChanged.connect(self.on_media_status_changed)
        self.playerB.errorOccurred.connect(self.on_error)

        self.slider.sliderPressed.connect(self.on_seek_pressed)
        self.slider.sliderReleased.connect(self.on_seek_released)
        self.slider.sliderMoved.connect(self.on_slider_moved)

    # Deck loading
    def load_deck_path(self, deck, path):
        if not path or not os.path.exists(path):
            return
        if deck == 'A':
            self.deckA_path = path; self.lbl_A.setText(os.path.basename(path))
        else:
            self.deckB_path = path; self.lbl_B.setText(os.path.basename(path))

    def load_deck_file(self, deck):
        path, _ = QFileDialog.getOpenFileName(self, f'Charger piste pour Deck {deck}', os.path.expanduser('~'), 'Audio files (*.mp3 *.wav *.flac *.ogg *.m4a)')
        if not path: return
        self.load_deck_path(deck, path)

    def play_deck(self, deck):
        path = getattr(self, f'deck{deck}_path', '')
        if not path:
            QMessageBox.information(self, 'Lecture', f'Aucune piste chargée pour Deck {deck}.')
            return
        apply_eq = getattr(self, f'chk_apply_eq_{deck}', None)
        if apply_eq and apply_eq.isChecked():
            self.preprocess_eq(deck, play_after=True)
            return
        player = self.playerA if deck == 'A' else self.playerB
        try:
            player.setSource(QUrl.fromLocalFile(path)); player.play()
        except Exception as e:
            QMessageBox.warning(self, 'Erreur', f'Impossible de jouer Deck {deck}: {e}')

    def pause_deck(self, deck):
        player = self.playerA if deck == 'A' else self.playerB
        try: player.pause()
        except Exception: pass

    def stop_deck(self, deck):
        player = self.playerA if deck == 'A' else self.playerB
        try: player.stop()
        except Exception: pass

    def toggle_play(self):
        # if both decks loaded, play/pause both
        if getattr(self, 'deckA_path', '') and getattr(self, 'deckB_path', ''):
            if self.playerA.playbackState() == QMediaPlayer.PlaybackState.PlayingState or self.playerB.playbackState() == QMediaPlayer.PlaybackState.PlayingState:
                self.playerA.pause(); self.playerB.pause()
            else:
                if getattr(self, 'deckA_path', ''):
                    self.playerA.setSource(QUrl.fromLocalFile(self.deckA_path)); self.playerA.play()
                if getattr(self, 'deckB_path', ''):
                    self.playerB.setSource(QUrl.fromLocalFile(self.deckB_path)); self.playerB.play()
                self.apply_crossfade(self.crossfade.value())
            return
        # fallback playlist
        state = self.playerA.playbackState()
        if state == QMediaPlayer.PlaybackState.PlayingState:
            self.playerA.pause()
        else:
            if self.playerA.source().isEmpty() and self.playlist and self.current_index >= 0:
                self.play_index(self.current_index)
            else:
                self.playerA.play()

    def stop_all(self):
        try: self.playerA.stop(); self.playerB.stop()
        except Exception: pass

    def next_track(self):
        if not self.playlist: return
        self.current_index = (self.current_index + 1) % len(self.playlist); self.play_index(self.current_index)

    def prev_track(self):
        if not self.playlist: return
        self.current_index = (self.current_index - 1) % len(self.playlist); self.play_index(self.current_index)

    # Playlist
    def add_files(self):
        files, _ = QFileDialog.getOpenFileNames(self, 'Ajouter des fichiers musicaux', os.path.expanduser('~'), 'Audio files (*.mp3 *.wav *.flac *.ogg *.m4a)')
        if not files: return
        self.add_paths(files)

    def add_paths(self, paths):
        if not paths: return
        valid_ext = ('.mp3', '.wav', '.flac', '.ogg', '.m4a')
        added = 0
        def collect(pth):
            if os.path.isdir(pth):
                for root, dirs, files in os.walk(pth):
                    for fn in files:
                        if fn.lower().endswith(valid_ext):
                            yield os.path.join(root, fn)
            else:
                yield pth
        for p in paths:
            if not p: continue
            for candidate in collect(p):
                if not os.path.exists(candidate): continue
                if not candidate.lower().endswith(valid_ext): continue
                self.playlist.append(candidate); self.list_widget.addItem(os.path.basename(candidate)); added += 1
        if added and self.current_index == -1:
            self.current_index = 0; self.update_now_label()

    def remove_selected(self):
        selected = self.list_widget.selectedIndexes()
        if not selected:
            QMessageBox.information(self, 'Supprimer', 'Aucun élément sélectionné.'); return
        rows = sorted((idx.row() for idx in selected), reverse=True)
        for r in rows:
            del self.playlist[r]; self.list_widget.takeItem(r)
            if r == self.current_index:
                self.stop_all(); self.current_index = -1
        if self.playlist:
            self.current_index = max(0, min(self.current_index, len(self.playlist)-1)); self.update_now_label()

    def on_item_double_clicked(self, item):
        row = self.list_widget.row(item); self.play_index(row)

    def play_index(self, index):
        if index < 0 or index >= len(self.playlist): return
        self.current_index = index; path = self.playlist[index]
        self.playerA.setSource(QUrl.fromLocalFile(path)); self.playerA.play(); self.update_now_label()

    # Mixer helpers
    def apply_gain(self, deck, db):
        vol = max(0.0, min(1.0, (db + 20) / 40.0))
        if deck == 'A': self.audioA.setVolume(vol * (self.vol_slider.value()/100.0))
        else: self.audioB.setVolume(vol * (self.vol_slider.value()/100.0))

    def apply_crossfade(self, val):
        a = max(0.0, min(1.0, (100 - val) / 100.0)); b = max(0.0, min(1.0, val / 100.0))
        gainA = (self.gainA.value() + 20) / 40.0; gainB = (self.gainB.value() + 20) / 40.0
        self.audioA.setVolume(a * gainA * (self.vol_slider.value()/100.0)); self.audioB.setVolume(b * gainB * (self.vol_slider.value()/100.0))

    # EQ processing
    def process_file_with_eq(self, src_path, bass_db=0, mid_db=0, treble_db=0, master_db=0):
        if not HAVE_PYDUB: return src_path
        try:
            seg = AudioSegment.from_file(src_path)
            bass = seg.low_pass_filter(250).apply_gain(bass_db)
            mid = seg.high_pass_filter(250).low_pass_filter(4000).apply_gain(mid_db)
            treble = seg.high_pass_filter(4000).apply_gain(treble_db)
            out = seg.overlay(bass); out = out.overlay(mid); out = out.overlay(treble)
            if master_db: out = out.apply_gain(master_db)
            tf = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            out.export(tf.name, format='wav'); tf.close(); self._temp_files.append(tf.name)
            return tf.name
        except Exception as e:
            print('EQ processing error:', e); return src_path

    def preprocess_eq(self, deck, play_after=False):
        def _start_worker(path, bass, mid, treble, play_after=False):
            if deck in self._eq_jobs:
                QMessageBox.information(self, 'Prétraiter', f'Un traitement est déjà en cours pour Deck {deck}.'); return
            worker = EQWorker(path, bass, mid, treble, deck=deck)
            self._eq_jobs[deck] = (worker, play_after)
            try: getattr(self, f'btn_preproc_{deck}').setEnabled(False)
            except Exception: pass
            worker.finished.connect(self.on_eq_finished); worker.start()

        path = getattr(self, f'deck{deck}_path', '')
        if not path: QMessageBox.information(self, 'Prétraiter', f'Aucune piste chargée pour Deck {deck}.'); return
        if not HAVE_PYDUB: QMessageBox.warning(self, 'Prétraiter', 'pydub ou ffmpeg non installé — impossible de prétraiter.'); return
        if deck == 'A': bass = self.eqA_bass.value(); mid = self.eqA_mid.value(); treble = self.eqA_treble.value()
        else: bass = self.eqB_bass.value(); mid = self.eqB_mid.value(); treble = self.eqB_treble.value()
        _start_worker(path, bass, mid, treble, play_after=play_after)

    def on_eq_finished(self, result_path, deck):
        job = self._eq_jobs.pop(deck, None); play_after = False
        if job:
            worker, play_after = job
            try: worker.quit(); worker.wait(100)
            except Exception: pass
        try:
            if result_path and os.path.exists(result_path):
                setattr(self, f'deck{deck}_path', result_path)
                try:
                    tmpdir = tempfile.gettempdir()
                    if os.path.commonpath([os.path.abspath(result_path), tmpdir]) == tmpdir:
                        self._temp_files.append(result_path)
                except Exception:
                    pass
                QMessageBox.information(self, 'Prétraiter', f'Prétraitement terminé pour Deck {deck}.')
        except Exception:
            pass
        try: getattr(self, f'btn_preproc_{deck}').setEnabled(True)
        except Exception: pass
        if play_after:
            player = self.playerA if deck == 'A' else self.playerB
            try: player.setSource(QUrl.fromLocalFile(getattr(self, f'deck{deck}_path', ''))); player.play()
            except Exception as e: QMessageBox.warning(self, 'Erreur', f'Impossible de lancer la lecture après prétraitement: {e}')

    # media callbacks
    def on_volume_changed(self, value):
        vol = max(0, min(100, int(value)))
        self.audioA.setVolume(vol / 100.0); self.audioB.setVolume(vol / 100.0)

    def on_position_changed(self, pos):
        if not getattr(self, '_user_seeking', False): self.slider.setValue(int(pos))

    def on_duration_changed(self, dur): self.slider.setRange(0, int(dur))

    def on_seek_pressed(self): self._user_seeking = True
    def on_seek_released(self):
        val = self.slider.value()
        try:
            self.playerA.setPosition(int(val)); self.playerB.setPosition(int(val))
        except Exception: pass
        self._user_seeking = False

    def on_slider_moved(self, val): self.lbl_now.setText(f'Position: {self.ms_to_hms(val)}')

    def on_state_changed(self, state):
        if state == QMediaPlayer.PlaybackState.PlayingState: self.btn_play.setText('⏸')
        else: self.btn_play.setText('▶️')

    def on_media_status_changed(self, status):
        if status == QMediaPlayer.MediaStatus.EndOfMedia: self.next_track()

    def on_error(self, err):
        try: QMessageBox.critical(self, 'Erreur lecteur', f'Erreur: {err}')
        except Exception: print('Erreur lecteur:', err)

    def update_now_label(self):
        if self.current_index >= 0 and self.current_index < len(self.playlist):
            base = os.path.basename(self.playlist[self.current_index]); self.lbl_now.setText(f'Lecture: {base}'); self.list_widget.setCurrentRow(self.current_index)
        else: self.lbl_now.setText('Aucun morceau')

    def ms_to_hms(self, ms):
        try: s = int(ms / 1000)
        except Exception: s = 0
        h = s // 3600; m = (s % 3600) // 60; sec = s % 60
        if h: return f'{h:02d}:{m:02d}:{sec:02d}'
        return f'{m:02d}:{sec:02d}'

    def closeEvent(self, event):
        for t in getattr(self, '_temp_files', []):
            try: os.remove(t)
            except Exception: pass
        try: self.playerA.stop(); self.playerB.stop()
        except Exception: pass
        super().closeEvent(event)


if __name__ == '__main__':
    app = QApplication(sys.argv)
    win = LecteurMusique()
    win.show()
    if not HAVE_PYDUB:
        print('Note: pydub not installed or ffmpeg missing — EQ processing disabled.')
    sys.exit(app.exec())
