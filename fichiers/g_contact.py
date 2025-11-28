from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QTableWidget, QTableWidgetItem, QMessageBox, QHeaderView
)
from PyQt6.QtGui import QFont, QBrush, QColor
from PyQt6.QtCore import Qt
import sqlite3
import re
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'contacts.db')
ID_COLOR = '#ffffff'  # couleur utilisée pour l'en-tête et les cellules ID (modifiable)

class ContactApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle('Gestion des contacts')
        self.resize(800, 600)
        self._connect_db()
        self._init_db()
        self._build_ui()
        # Appliquer les styles (thème + styles spécifiques aux boutons)
        self.apply_styles()
        # Ré-appliquer la couleur noire sur l'en-tête 'ID' après application du style QSS
        header_item = self.table.horizontalHeaderItem(0)
        if header_item:
            header_item.setForeground(QBrush(QColor(ID_COLOR)))
        self.load_contacts()

    def _connect_db(self):
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row
        self.cur = self.conn.cursor()

    def _init_db(self):
        self.cur.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL,
                postnom TEXT,
                prenom TEXT,
                telephone TEXT,
                adresse TEXT,
                email TEXT
            )
        ''')
        self.conn.commit()

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout()
        central.setLayout(layout)

        font_label = QFont('Arial', 11)

        # Form
        form_layout = QHBoxLayout()

        left_col = QVBoxLayout()
        right_col = QVBoxLayout()

        # Nom
        lbl_nom = QLabel('Nom')
        lbl_nom.setFont(font_label)
        self.input_nom = QLineEdit()
        self.input_nom.setPlaceholderText('Nom (obligatoire)')
        self.input_nom.setToolTip('Entrez le nom')
        left_col.addWidget(lbl_nom)
        left_col.addWidget(self.input_nom)

        # Postnom
        lbl_post = QLabel('Postnom')
        lbl_post.setFont(font_label)
        self.input_post = QLineEdit()
        self.input_post.setPlaceholderText('Postnom')
        self.input_post.setToolTip('Entrez le postnom')
        left_col.addWidget(lbl_post)
        left_col.addWidget(self.input_post)

        # Prenom
        lbl_pre = QLabel('Prenom')
        lbl_pre.setFont(font_label)
        self.input_pre = QLineEdit()
        self.input_pre.setPlaceholderText('Prenom')
        self.input_pre.setToolTip('Entrez le prenom')
        left_col.addWidget(lbl_pre)
        left_col.addWidget(self.input_pre)

        # Telephone
        lbl_tel = QLabel('Téléphone')
        lbl_tel.setFont(font_label)
        self.input_tel = QLineEdit()
        self.input_tel.setPlaceholderText('Téléphone')
        self.input_tel.setToolTip('Numéro de téléphone')
        right_col.addWidget(lbl_tel)
        right_col.addWidget(self.input_tel)

        # Adresse
        lbl_addr = QLabel('Adresse')
        lbl_addr.setFont(font_label)
        self.input_addr = QLineEdit()
        self.input_addr.setPlaceholderText('Adresse')
        self.input_addr.setToolTip('Adresse postale')
        right_col.addWidget(lbl_addr)
        right_col.addWidget(self.input_addr)

        # Email
        lbl_email = QLabel('E-mail')
        lbl_email.setFont(font_label)
        self.input_email = QLineEdit()
        self.input_email.setPlaceholderText('email@example.com')
        self.input_email.setToolTip('Adresse e-mail')
        right_col.addWidget(lbl_email)
        right_col.addWidget(self.input_email)

        form_layout.addLayout(left_col)
        form_layout.addLayout(right_col)

        # Buttons
        btn_layout = QHBoxLayout()
        self.btn_add = QPushButton('Ajouter')
        self.btn_add.setObjectName('btnAdd')
        self.btn_add.setToolTip('Ajouter le contact à la base')
        self.btn_add.clicked.connect(self.add_contact)

        # Bouton Modifier
        self.btn_edit = QPushButton('Modifier')
        self.btn_edit.setObjectName('btnEdit')
        self.btn_edit.setToolTip('Modifier le contact sélectionné')
        self.btn_edit.clicked.connect(self.edit_contact)

        self.btn_delete = QPushButton('Supprimer')
        self.btn_delete.setObjectName('btnDelete')
        self.btn_delete.setToolTip('Supprimer le contact sélectionné')
        self.btn_delete.clicked.connect(self.delete_selected)

        self.btn_clear = QPushButton('Effacer')
        self.btn_clear.setObjectName('btnClear')
        self.btn_clear.setToolTip('Effacer le formulaire')
        self.btn_clear.clicked.connect(self.clear_form)

        btn_layout.addWidget(self.btn_add)
        btn_layout.addWidget(self.btn_edit)
        btn_layout.addWidget(self.btn_delete)
        btn_layout.addWidget(self.btn_clear)

        # Table
        self.table = QTableWidget(0, 7)
        self.table.setHorizontalHeaderLabels(['ID', 'Nom', 'Postnom', 'Prenom', 'Téléphone', 'Adresse', 'E-mail'])
        # colorer le texte de l'en-tête ID en noir
        header_item = self.table.horizontalHeaderItem(0)
        if header_item:
            header_item.setForeground(QBrush(QColor(ID_COLOR)))
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(self.table.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(self.table.EditTrigger.NoEditTriggers)
        self.table.cellClicked.connect(self.on_table_click)

        layout.addLayout(form_layout)
        layout.addLayout(btn_layout)
        layout.addWidget(self.table)

    def apply_styles(self):
        """Feuille de style QSS pour l'application de contacts : thème sombre et boutons différenciés."""
        self.setStyleSheet(r"""
            /* Fenêtre */
            QMainWindow, QWidget {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #071226, stop:1 #0b1b2a);
                color: #e6eef8;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 13px;
            }
            /* Labels */
            QLabel { color: #cfe8ff; font-weight: 600; }
            /* Inputs */
            QLineEdit {
                background: #0e2532;
                border: 1px solid #1f3647;
                border-radius: 8px;
                padding: 8px;
                color: #eaf6ff;
            }
            QLineEdit:focus { border: 1px solid #57d08a; background: #08161d; }

            /* Table */
            QTableWidget { background: rgba(255,255,255,0.02); border-radius: 8px; }
            QTableWidget::item:selected { background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #2b6b4f, stop:1 #1f513d); color: #fff; }
            QHeaderView::section { background: #082029; color: #bfe6ff; padding: 6px; border: 1px solid #0f2a36; }

            /* Primary button (Ajouter) */
            QPushButton#btnAdd {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #4facfe, stop:1 #00f2fe);
                color: #002233; font-weight: 700; border-radius: 8px; padding: 8px 14px;
            }
            QPushButton#btnAdd:hover { background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #66c8ff, stop:1 #33f6ff); }
            QPushButton#btnAdd:pressed { background: #00b8d8; }

            /* Edit button (Modifier) */
            QPushButton#btnEdit {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #ffd166, stop:1 #ffb020);
                color: #1b1b1b; font-weight: 700; border-radius: 8px; padding: 8px 14px;
            }
            QPushButton#btnEdit:hover { background: #ffe08a; }
            QPushButton#btnEdit:pressed { background: #ff9f1c; }

            /* Danger button (Supprimer) */
            QPushButton#btnDelete {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #ff6b6b, stop:1 #ff3b3b);
                color: white; font-weight: 700; border-radius: 8px; padding: 8px 14px;
            }
            QPushButton#btnDelete:hover { background: #ff8080; }
            QPushButton#btnDelete:pressed { background: #e02b2b; }

            /* Secondary button (Effacer) */
            QPushButton#btnClear {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #2f3640, stop:1 #1b242b);
                color: #cfe8ff; border: 1px solid #29323a; border-radius: 8px; padding: 8px 14px;
            }
            QPushButton#btnClear:hover { background: #39424a; }
            QPushButton#btnClear:pressed { background: #1a2026; }

            /* Tooltips */
            QToolTip { background: #0e2532; color: #e6eef8; border: 1px solid #233447; padding: 6px; border-radius: 4px; }
        """)

    def validate(self, data):
        # data is dict with keys: nom, telephone, email
        if not data.get('nom'):
            QMessageBox.warning(self, 'Validation', 'Le nom est obligatoire.')
            return False
        tel = data.get('telephone', '').strip()
        if tel and not re.match(r'^[0-9+\-() ]+$', tel):
            QMessageBox.warning(self, 'Validation', 'Numéro de téléphone invalide.')
            return False
        email = data.get('email', '').strip()
        if email and not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            QMessageBox.warning(self, 'Validation', 'Adresse e-mail invalide.')
            return False
        return True

    def add_contact(self):
        data = {
            'nom': self.input_nom.text().strip(),
            'postnom': self.input_post.text().strip(),
            'prenom': self.input_pre.text().strip(),
            'telephone': self.input_tel.text().strip(),
            'adresse': self.input_addr.text().strip(),
            'email': self.input_email.text().strip()
        }
        if not self.validate(data):
            return
        try:
            self.cur.execute('''INSERT INTO contacts (nom, postnom, prenom, telephone, adresse, email)
                                VALUES (?, ?, ?, ?, ?, ?)''',
                             (data['nom'], data['postnom'], data['prenom'], data['telephone'], data['adresse'], data['email']))
            self.conn.commit()
            QMessageBox.information(self, 'Succès', 'Contact ajouté avec succès.')
            self.clear_form()
            self.load_contacts()
        except Exception as e:
            QMessageBox.critical(self, 'Erreur', f'Impossible d\'ajouter le contact: {e}')

    def load_contacts(self):
        self.table.setRowCount(0)
        self.cur.execute('SELECT * FROM contacts ORDER BY nom, postnom, prenom')
        rows = self.cur.fetchall()
        for r in rows:
            rowpos = self.table.rowCount()
            self.table.insertRow(rowpos)
            id_item = QTableWidgetItem(str(r['id']))
            id_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            id_item.setForeground(QBrush(QColor(ID_COLOR)))
            self.table.setItem(rowpos, 0, id_item)
            self.table.setItem(rowpos, 1, QTableWidgetItem(r['nom']))
            self.table.setItem(rowpos, 2, QTableWidgetItem(r['postnom'] or ''))
            self.table.setItem(rowpos, 3, QTableWidgetItem(r['prenom'] or ''))
            self.table.setItem(rowpos, 4, QTableWidgetItem(r['telephone'] or ''))
            self.table.setItem(rowpos, 5, QTableWidgetItem(r['adresse'] or ''))
            self.table.setItem(rowpos, 6, QTableWidgetItem(r['email'] or ''))
        # show id column and style it
        self.table.setColumnHidden(0, False)
        try:
            # set a reasonable width for the ID column
            self.table.setColumnWidth(0, 70)
        except Exception:
            pass
        # ensure header 'ID' text is black (re-apply after styles)
        header_item = self.table.horizontalHeaderItem(0)
        if header_item:
            header_item.setForeground(QBrush(QColor(ID_COLOR)))

    def on_table_click(self, row, column):
        # fill form with selected
        id_item = self.table.item(row, 0)
        if not id_item:
            return
        cid = id_item.text()
        self.cur.execute('SELECT * FROM contacts WHERE id = ?', (cid,))
        r = self.cur.fetchone()
        if r:
            self.input_nom.setText(r['nom'] or '')
            self.input_post.setText(r['postnom'] or '')
            self.input_pre.setText(r['prenom'] or '')
            self.input_tel.setText(r['telephone'] or '')
            self.input_addr.setText(r['adresse'] or '')
            self.input_email.setText(r['email'] or '')
            # select current row visually and store current id (optional)
            self.table.selectRow(row)
            self.current_edit_id = cid

    def delete_selected(self):
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, 'Suppression', 'Sélectionnez d\'abord une ligne à supprimer.')
            return
        ids = []
        for ix in selected:
            row = ix.row()
            id_item = self.table.item(row, 0)
            if id_item:
                ids.append(id_item.text())
        if not ids:
            return
        reply = QMessageBox.question(self, 'Confirmer', f'Voulez-vous supprimer {len(ids)} contact(s) ?')
        if reply != QMessageBox.StandardButton.Yes:
            return
        try:
            q = 'DELETE FROM contacts WHERE id IN ({seq})'.format(seq=','.join('?' for _ in ids))
            self.cur.execute(q, ids)
            self.conn.commit()
            QMessageBox.information(self, 'Suppression', 'Contact(s) supprimé(s).')
            self.clear_form()
            self.load_contacts()
        except Exception as e:
            QMessageBox.critical(self, 'Erreur', f'Impossible de supprimer: {e}')

    def edit_contact(self):
        """Met à jour le contact actuellement sélectionné avec les valeurs du formulaire."""
        # Require a selected id
        try:
            selected_rows = self.table.selectionModel().selectedRows()
            if not selected_rows:
                QMessageBox.warning(self, 'Modifier', 'Sélectionnez d\'abord un contact à modifier (cliquez sur la ligne).')
                return
            # use the first selected row's id
            row = selected_rows[0].row()
            id_item = self.table.item(row, 0)
            if not id_item:
                QMessageBox.warning(self, 'Modifier', 'Impossible de déterminer l\'ID du contact sélectionné.')
                return
            cid = id_item.text()
        except Exception:
            QMessageBox.warning(self, 'Modifier', 'Aucune sélection valide.')
            return

        data = {
            'nom': self.input_nom.text().strip(),
            'postnom': self.input_post.text().strip(),
            'prenom': self.input_pre.text().strip(),
            'telephone': self.input_tel.text().strip(),
            'adresse': self.input_addr.text().strip(),
            'email': self.input_email.text().strip()
        }
        if not self.validate(data):
            return

        try:
            self.cur.execute('''UPDATE contacts SET nom=?, postnom=?, prenom=?, telephone=?, adresse=?, email=? WHERE id=?''',
                             (data['nom'], data['postnom'], data['prenom'], data['telephone'], data['adresse'], data['email'], cid))
            self.conn.commit()
            QMessageBox.information(self, 'Modifier', 'Contact mis à jour avec succès.')
            self.clear_form()
            self.load_contacts()
        except Exception as e:
            QMessageBox.critical(self, 'Erreur', f'Impossible de mettre à jour : {e}')

    def clear_form(self):
        self.input_nom.clear()
        self.input_post.clear()
        self.input_pre.clear()
        self.input_tel.clear()
        self.input_addr.clear()
        self.input_email.clear()
        # clear edit id
        self.current_edit_id = None

    def closeEvent(self, event):
        # fermer connexion sqlite
        try:
            self.conn.close()
        except Exception:
            pass
        super().closeEvent(event)


if __name__ == '__main__':
    import sys
    app = QApplication(sys.argv)
    win = ContactApp()
    win.show()
    sys.exit(app.exec())
