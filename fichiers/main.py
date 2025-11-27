from PyQt6.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QLineEdit, QPushButton, QGridLayout, QLabel
from PyQt6.QtGui import QFont
from PyQt6.QtCore import Qt
import math

class Calculator(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Calculatrice Scientifique")
        self.setFixedSize(400, 600)
        self.setStyleSheet("background-color: black; color: white;")

        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)

        self.layout = QVBoxLayout()
        self.central_widget.setLayout(self.layout)

        self.history = QLabel("Historique:")
        self.history.setFont(QFont("Arial", 12))
        self.history.setStyleSheet("background-color: white; color: black;")
        self.history.setAlignment(Qt.AlignmentFlag.AlignLeft)
        self.layout.addWidget(self.history)

        self.create_display()
        self.create_buttons()

    def create_display(self):
        self.display = QLineEdit()
        self.display.setFont(QFont("Arial", 24))
        self.display.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.display.setReadOnly(True)
        self.display.setStyleSheet("background-color: white; color: black;")
        self.layout.addWidget(self.display)

    def create_buttons(self):
        self.buttons = QWidget()
        self.buttons_layout = QGridLayout()
        self.buttons.setLayout(self.buttons_layout)

        button_definitions = [
            ("7", 0, 0), ("8", 0, 1), ("9", 0, 2), ("/", 0, 3),
            ("4", 1, 0), ("5", 1, 1), ("6", 1, 2), ("*", 1, 3),
            ("1", 2, 0), ("2", 2, 1), ("3", 2, 2), ("-", 2, 3),
            ("0", 3, 0), (".", 3, 1), ("=", 3, 2), ("+", 3, 3),
            ("sin", 4, 0), ("cos", 4, 1), ("tan", 4, 2), ("sqrt", 4, 3),
            ("log", 5, 0), ("ln", 5, 1), ("^", 5, 2), ("C", 5, 3),
            ("exp", 6, 0), ("1/x", 6, 1), ("deg", 6, 2), ("rad", 6, 3),
            ("Supprimer Historique", 7, 0, 1, 4)  # Renommé le bouton
        ]

        for text, row, col, *span in button_definitions:
            button = QPushButton(text)
            button.setFont(QFont("Arial", 18))
            if text in {"/", "*", "-", "+", "=", "C", "sin", "cos", "tan", "sqrt", "log", "ln", "^", "exp", "1/x", "deg", "rad", "Supprimer Historique"}:
                button.setStyleSheet(
                    "QPushButton {"
                    "    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #ffffff, stop:1 #d3d3d3);"
                    "    color: black;"
                    "    border: 1px solid #00ffcc;"
                    "    border-radius: 5px;"
                    "    padding: 10px;"
                    "}"
                    "QPushButton:hover {"
                    "    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #f0f0f0, stop:1 #c0c0c0);"
                    "}"
                    "QPushButton:pressed {"
                    "    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #e0e0e0, stop:1 #a0a0a0);"
                    "}"
                )
            else:
                button.setStyleSheet(
                    "QPushButton {"
                    "    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #4facfe, stop:1 #00f2fe);"
                    "    color: white;"
                    "    border: 1px solid #00ffcc;"
                    "    border-radius: 5px;"
                    "    padding: 10px;"
                    "}"
                    "QPushButton:hover {"
                    "    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #5fc9fe, stop:1 #33f3fe);"
                    "}"
                    "QPushButton:pressed {"
                    "    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #3fa9fe, stop:1 #00d2fe);"
                    "}"
                )
            button.clicked.connect(self.on_button_click)
            if span:
                self.buttons_layout.addWidget(button, row, col, *span)
            else:
                self.buttons_layout.addWidget(button, row, col)

        self.layout.addWidget(self.buttons)

    def on_button_click(self):
        sender = self.sender()
        text = sender.text()

        if text == "C":
            self.display.clear()
        elif text == "Supprimer Historique":
            self.history.setText("Historique:")
        elif text == "=":
            try:
                expression = self.display.text()
                result = eval(expression)
                self.history.setText(self.history.text() + f"\n{expression} = {result}")
                self.display.setText(str(result))
            except Exception as e:
                self.display.setText("Erreur")
        elif text in {"sin", "cos", "tan", "sqrt", "log", "ln", "exp", "1/x", "deg", "rad"}:
            try:
                value = float(self.display.text())
                if text == "sin":
                    result = math.sin(math.radians(value))
                elif text == "cos":
                    result = math.cos(math.radians(value))
                elif text == "tan":
                    result = math.tan(math.radians(value))
                elif text == "sqrt":
                    result = math.sqrt(value)
                elif text == "log":
                    result = math.log10(value)
                elif text == "ln":
                    result = math.log(value)
                elif text == "exp":
                    result = math.exp(value)
                elif text == "1/x":
                    result = 1 / value
                elif text == "deg":
                    result = math.degrees(value)
                elif text == "rad":
                    result = math.radians(value)
                self.history.setText(self.history.text() + f"\n{text}({value}) = {result}")
                self.display.setText(str(result))
            except Exception as e:
                self.display.setText("Erreur")
        else:
            self.display.setText(self.display.text() + text)

if __name__ == "__main__":
    app = QApplication([])
    window = Calculator()
    window.show()
    app.exec()
