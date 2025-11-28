from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QCheckBox, QRadioButton, QComboBox, QSlider, QProgressBar, QSpinBox, QTextEdit, QSizePolicy, QMessageBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

class WidgetDemo(QMainWindow):

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Démonstration des Widgets PyQt6")
        # Augmenter un peu la taille initiale et la taille minimale
        self.resize(1000, 920)        # taille initiale plus grande
        self.setMinimumSize(700, 500) # taille minimale autorisée

        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)

        # Layout extérieur : ajoute des stretches latéraux pour centrer un conteneur
        self.outer_layout = QHBoxLayout()
        self.outer_layout.setContentsMargins(20, 20, 20, 20)
        self.central_widget.setLayout(self.outer_layout)

        # Conteneur central limité en largeur : les widgets iront dans self.layout
        self.content_widget = QWidget()
        self.layout = QVBoxLayout()
        self.layout.setContentsMargins(16, 16, 16, 16)
        self.layout.setSpacing(14)
        self.content_widget.setLayout(self.layout)
        self.content_widget.setMaximumWidth(900)  # empêche d'occuper toute la largeur (élargi)

        self.outer_layout.addStretch()
        self.outer_layout.addWidget(self.content_widget)
        self.outer_layout.addStretch()

        self.create_widgets()
        self.apply_styles()

    def create_widgets(self):
        # QLabel
        label = QLabel("Ceci est un QLabel")
        label.setFont(QFont("Arial", 18))
        label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        label.setMaximumWidth(800)
        label.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        label.setToolTip("Titre descriptif de la section")
        self.layout.addWidget(label)

        # QPushButton
        button = QPushButton("Cliquez ici")
        button.setFont(QFont("Arial", 14))
        # on affiche une QMessageBox informative quand on clique
        button.clicked.connect(self.show_info_message)
        button.setMaximumWidth(800)
        button.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        button.setToolTip("Cliquez pour afficher un message d'information")
        self.layout.addWidget(button)

        # QLineEdit
        self.line_edit = QLineEdit()
        self.line_edit.setPlaceholderText("Tapez quelque chose...")
        self.line_edit.setFont(QFont("Arial", 13))
        self.line_edit.setMaximumWidth(800)
        self.line_edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.line_edit.setToolTip("Entrez du texte ici. Appuie sur Entrée (non implémenté) pour valider")
        self.layout.addWidget(self.line_edit)

        # QCheckBox
        checkbox = QCheckBox("Ceci est une case à cocher")
        checkbox.setFont(QFont("Arial", 13))
        checkbox.stateChanged.connect(self.on_checkbox_toggle)
        checkbox.setMaximumWidth(800)
        checkbox.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        checkbox.setToolTip("Cochez ou décochez pour activer/désactiver une option")
        self.layout.addWidget(checkbox)

        # QRadioButton
        radio_button = QRadioButton("Ceci est un bouton radio")
        radio_button.setFont(QFont("Arial", 13))
        radio_button.toggled.connect(self.on_radio_toggle)
        radio_button.setMaximumWidth(800)
        radio_button.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        radio_button.setToolTip("Sélectionnez cette option radio")
        self.layout.addWidget(radio_button)

        # QComboBox
        combo_box = QComboBox()
        combo_box.addItems(["Option 1", "Option 2", "Option 3"])
        combo_box.setFont(QFont("Arial", 13))
        combo_box.currentIndexChanged.connect(self.on_combobox_change)
        combo_box.setMaximumWidth(800)
        combo_box.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        combo_box.setToolTip("Choisissez une option dans la liste déroulante")
        self.layout.addWidget(combo_box)

        # QSlider
        slider = QSlider(Qt.Orientation.Horizontal)
        slider.setRange(0, 100)
        slider.valueChanged.connect(self.on_slider_change)
        slider.setMaximumWidth(800)
        slider.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        slider.setToolTip("Faites glisser pour ajuster une valeur (0-100)")
        self.layout.addWidget(slider)

        # QProgressBar
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(50)
        self.progress_bar.setMaximumWidth(800)
        self.progress_bar.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.progress_bar.setToolTip("Barre de progression liée au slider")
        self.layout.addWidget(self.progress_bar)

        # QSpinBox
        spin_box = QSpinBox()
        spin_box.setRange(0, 100)
        spin_box.valueChanged.connect(self.on_spinbox_change)
        spin_box.setMaximumWidth(240)
        spin_box.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Fixed)
        spin_box.setToolTip("Sélectionnez une valeur numérique")
        self.layout.addWidget(spin_box)

        # QTextEdit
        text_edit = QTextEdit()
        text_edit.setPlaceholderText("Ceci est un QTextEdit pour du texte long...")
        text_edit.setFont(QFont("Arial", 13))
        text_edit.setMaximumWidth(800)
        text_edit.setMinimumHeight(160)
        text_edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        text_edit.setToolTip("Zone de texte pour saisir plusieurs lignes")
        self.layout.addWidget(text_edit)

        # small spacer at the bottom
        self.layout.addStretch()

    def show_info_message(self):
        # Affiche un QMessageBox d'information
        info_text = "Ceci est une fenêtre d'information. Utilisez les infobulles pour obtenir de l'aide sur chaque contrôle."
        QMessageBox.information(self, "Information", info_text)

    def closeEvent(self, event):
        # Confirmation avant de fermer l'application
        reply = QMessageBox.question(self, "Quitter", "Voulez-vous vraiment quitter ?",
                                     QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if reply == QMessageBox.StandardButton.Yes:
            event.accept()
        else:
            event.ignore()

    def on_button_click(self):
        print("Bouton cliqué !")

    def on_checkbox_toggle(self, state):
        print(f"Case à cocher {'cochée' if state == Qt.CheckState.Checked else 'décochée'}")

    def on_radio_toggle(self, checked):
        if checked:
            print("Bouton radio sélectionné")

    def on_combobox_change(self, index):
        print(f"Option sélectionnée : {index}")

    def on_slider_change(self, value):
        print(f"Valeur du slider : {value}")
        self.progress_bar.setValue(value)

    def on_spinbox_change(self, value):
        print(f"Valeur du spinbox : {value}")

    def apply_styles(self):
        # Feuille de style centralisée pour l'application
        self.setStyleSheet("""
            QWidget {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #0f1724, stop:1 #111827);
                color: #e6eef8;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 13px;
            }

            QLabel#titleLabel {
                font-size: 20px;
                font-weight: 700;
                color: #eaf6ff;
            }

            QLabel {
                color: #cfe8ff;
            }

            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #48c78e, stop:1 #2b9e67);
                color: white;
                border: 1px solid #1f7a53;
                padding: 8px 12px;
                border-radius: 6px;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #5fd79f, stop:1 #36b576);
            }
            QPushButton:pressed {
                background: #238b5a;
            }

            QLineEdit, QComboBox, QSpinBox, QTextEdit {
                background: #0f1724;
                border: 1px solid #233142;
                border-radius: 6px;
                padding: 6px;
                color: #e6eef8;
            }

            QComboBox {
                padding-right: 20px;
            }

            QSlider::groove:horizontal {
                height: 8px;
                background: #1f2b3a;
                border-radius: 4px;
            }
            QSlider::handle:horizontal {
                background: #60c48c;
                border: 1px solid #2b6b4a;
                width: 18px;
                margin: -5px 0;
                border-radius: 9px;
            }

            QProgressBar {
                background: #0f1724;
                border: 1px solid #233142;
                border-radius: 6px;
                text-align: center;
                color: #cfe8ff;
            }
            QProgressBar::chunk {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #48c78e, stop:1 #2b9e67);
                border-radius: 6px;
            }

            QCheckBox, QRadioButton {
                color: #cfe8ff;
            }

            /* Small helper for the window control buttons if present */
            .window-controls QPushButton {
                background: transparent;
                color: #cfe8ff;
                border: none;
                padding: 6px;
            }
            .window-controls QPushButton:hover {
                background: rgba(255,255,255,0.03);
                border-radius: 4px;
            }

        """)

if __name__ == "__main__":
    import sys
    app = QApplication(sys.argv)
    window = WidgetDemo()
    window.show()
    sys.exit(app.exec())
