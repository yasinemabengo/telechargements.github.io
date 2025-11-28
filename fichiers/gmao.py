from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QLineEdit, QPushButton, QTableWidget, QTableWidgetItem, QMessageBox,
    QHeaderView, QTextEdit, QComboBox, QDateEdit, QSpinBox
)
from PyQt6.QtGui import QFont
from PyQt6.QtCore import Qt, QDate
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'gmao.db')

class GMAOApp(QMainWindow):
    """Application GMAO simple avec gestion des équipements et des opérations de maintenance."""
    def __init__(self):
        super().__init__()
        self.setWindowTitle('GMAO - Gestion de maintenance')
        self.resize(1100, 700)
        self._connect_db()
        self._init_db()
        self._build_ui()
        self.apply_styles()
        self.load_assets()

    def _connect_db(self):
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row
        self.cur = self.conn.cursor()

    def _init_db(self):
        # Tables: assets, maintenance
        self.cur.execute('''
            CREATE TABLE IF NOT EXISTS assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                location TEXT,
                purchase_date TEXT,
                serial TEXT,
                status TEXT
            )
        ''')
        self.cur.execute('''
            CREATE TABLE IF NOT EXISTS maintenance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                date TEXT,
                technician TEXT,
                description TEXT,
                cost REAL,
                FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
            )
        ''')
        self.conn.commit()

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        outer = QHBoxLayout()
        central.setLayout(outer)

        # Left: Form + buttons + assets table
        left = QVBoxLayout()

        title = QLabel('Équipements')
        title.setFont(QFont('Arial', 16, QFont.Weight.Bold))
        left.addWidget(title)

        # Form fields for asset
        form = QHBoxLayout()
        col1 = QVBoxLayout()
        col2 = QVBoxLayout()

        self.input_name = QLineEdit(); self.input_name.setPlaceholderText('Nom de l\'équipement')
        self.input_category = QLineEdit(); self.input_category.setPlaceholderText('Catégorie')
        self.input_location = QLineEdit(); self.input_location.setPlaceholderText('Emplacement')
        self.input_purchase = QDateEdit(); self.input_purchase.setCalendarPopup(True); self.input_purchase.setDate(QDate.currentDate())
        self.input_serial = QLineEdit(); self.input_serial.setPlaceholderText('N° de série')
        self.input_status = QComboBox(); self.input_status.addItems(['En service', 'Hors service', 'En maintenance'])

        col1.addWidget(QLabel('Nom'))
        col1.addWidget(self.input_name)
        col1.addWidget(QLabel('Catégorie'))
        col1.addWidget(self.input_category)
        col1.addWidget(QLabel('Emplacement'))
        col1.addWidget(self.input_location)

        col2.addWidget(QLabel('Date d\'achat'))
        col2.addWidget(self.input_purchase)
        col2.addWidget(QLabel('N° de série'))
        col2.addWidget(self.input_serial)
        col2.addWidget(QLabel('Statut'))
        col2.addWidget(self.input_status)

        form.addLayout(col1)
        form.addLayout(col2)
        left.addLayout(form)

        # Buttons
        btns = QHBoxLayout()
        self.btn_add = QPushButton('Ajouter'); self.btn_add.setObjectName('btnPrimary'); self.btn_add.clicked.connect(self.add_asset)
        self.btn_edit = QPushButton('Modifier'); self.btn_edit.setObjectName('btnEdit'); self.btn_edit.clicked.connect(self.edit_asset)
        self.btn_delete = QPushButton('Supprimer'); self.btn_delete.setObjectName('btnDanger'); self.btn_delete.clicked.connect(self.delete_asset)
        self.btn_clear = QPushButton('Effacer'); self.btn_clear.setObjectName('btnSecondary'); self.btn_clear.clicked.connect(self.clear_asset_form)
        btns.addWidget(self.btn_add); btns.addWidget(self.btn_edit); btns.addWidget(self.btn_delete); btns.addWidget(self.btn_clear)
        left.addLayout(btns)

        # Assets table
        self.table_assets = QTableWidget(0, 7)
        self.table_assets.setHorizontalHeaderLabels(['ID','Nom','Catégorie','Emplacement','Achat','N° série','Statut'])
        self.table_assets.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_assets.setSelectionBehavior(self.table_assets.SelectionBehavior.SelectRows)
        self.table_assets.setEditTriggers(self.table_assets.EditTrigger.NoEditTriggers)
        self.table_assets.cellClicked.connect(self.on_asset_select)
        left.addWidget(self.table_assets)

        outer.addLayout(left, 2)

        # Right: Maintenance logs
        right = QVBoxLayout()
        title2 = QLabel('Interventions')
        title2.setFont(QFont('Arial', 16, QFont.Weight.Bold))
        right.addWidget(title2)

        # current asset label
        self.current_asset_label = QLabel('Aucun équipement sélectionné')
        right.addWidget(self.current_asset_label)

        # Logs table
        self.table_logs = QTableWidget(0,6)
        self.table_logs.setHorizontalHeaderLabels(['ID','Date','Technicien','Description','Coût','AssetID'])
        self.table_logs.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_logs.setSelectionBehavior(self.table_logs.SelectionBehavior.SelectRows)
        self.table_logs.setEditTriggers(self.table_logs.EditTrigger.NoEditTriggers)
        right.addWidget(self.table_logs)

        # Log form
        log_form = QHBoxLayout()
        lc = QVBoxLayout(); rc = QVBoxLayout()
        self.input_log_date = QDateEdit(); self.input_log_date.setCalendarPopup(True); self.input_log_date.setDate(QDate.currentDate())
        self.input_tech = QLineEdit(); self.input_tech.setPlaceholderText('Nom technicien')
        self.input_cost = QLineEdit(); self.input_cost.setPlaceholderText('Coût (ex: 123.45)')
        self.input_desc = QTextEdit(); self.input_desc.setPlaceholderText('Description de l\'intervention')
        self.input_desc.setFixedHeight(100)

        lc.addWidget(QLabel('Date'))
        lc.addWidget(self.input_log_date)
        lc.addWidget(QLabel('Technicien'))
        lc.addWidget(self.input_tech)
        lc.addWidget(QLabel('Coût'))
        lc.addWidget(self.input_cost)

        rc.addWidget(QLabel('Description'))
        rc.addWidget(self.input_desc)

        log_form.addLayout(lc,1); log_form.addLayout(rc,2)
        right.addLayout(log_form)

        # Log buttons
        log_btns = QHBoxLayout()
        self.btn_log_add = QPushButton('Ajouter intervention'); self.btn_log_add.setObjectName('btnPrimary'); self.btn_log_add.clicked.connect(self.add_log)
        self.btn_log_delete = QPushButton('Supprimer intervention'); self.btn_log_delete.setObjectName('btnDanger'); self.btn_log_delete.clicked.connect(self.delete_log)
        self.btn_log_clear = QPushButton('Effacer'); self.btn_log_clear.setObjectName('btnSecondary'); self.btn_log_clear.clicked.connect(self.clear_log_form)
        log_btns.addWidget(self.btn_log_add); log_btns.addWidget(self.btn_log_delete); log_btns.addWidget(self.btn_log_clear)
        right.addLayout(log_btns)

        outer.addLayout(right, 3)

        # state
        self.current_asset_id = None

    # Styles
    def apply_styles(self):
        self.setStyleSheet(r"""
            QMainWindow, QWidget { background: qlineargradient(x1:0,y1:0,x2:1,y2:1, stop:0 #071226, stop:1 #0b1b2a); color: #e6eef8; font-family: 'Segoe UI', Arial; }
            QLabel { color: #cfe8ff; }
            QLineEdit, QDateEdit, QTextEdit, QComboBox { background: #0e2532; border: 1px solid #1f3647; border-radius: 6px; padding: 6px; color: #eaf6ff; }
            QTableWidget { background: rgba(255,255,255,0.02); border-radius: 8px; gridline-color: rgba(255,255,255,0.03); }
            QHeaderView::section { background: #082029; color: #bfe6ff; padding:6px; }
            QPushButton#btnPrimary { background: qlineargradient(x1:0,y1:0,x2:0,y2:1, stop:0 #4facfe, stop:1 #00f2fe); color: #002233; font-weight:700; border-radius:8px; padding:8px 14px; }
            QPushButton#btnPrimary:hover { background: #66c8ff; }
            QPushButton#btnEdit { background: qlineargradient(x1:0,y1:0,x2:0,y2:1, stop:0 #ffd166, stop:1 #ffb020); color:#1b1b1b; font-weight:700; border-radius:8px; padding:8px 14px; }
            QPushButton#btnDanger { background: qlineargradient(x1:0,y1:0,x2:0,y2:1, stop:0 #ff6b6b, stop:1 #ff3b3b); color:#fff; font-weight:700; border-radius:8px; padding:8px 14px; }
            QPushButton#btnSecondary { background: qlineargradient(x1:0,y1:0,x2:0,y2:1, stop:0 #2f3640, stop:1 #1b242b); color:#cfe8ff; border:1px solid #29323a; border-radius:8px; padding:8px 14px; }
            QToolTip { background: #0e2532; color:#e6eef8; }
        """)

    # Asset CRUD
    def load_assets(self):
        self.table_assets.setRowCount(0)
        self.cur.execute('SELECT * FROM assets ORDER BY name')
        for r in self.cur.fetchall():
            row = self.table_assets.rowCount(); self.table_assets.insertRow(row)
            self.table_assets.setItem(row,0,QTableWidgetItem(str(r['id'])))
            self.table_assets.setItem(row,1,QTableWidgetItem(r['name']))
            self.table_assets.setItem(row,2,QTableWidgetItem(r['category'] or ''))
            self.table_assets.setItem(row,3,QTableWidgetItem(r['location'] or ''))
            self.table_assets.setItem(row,4,QTableWidgetItem(r['purchase_date'] or ''))
            self.table_assets.setItem(row,5,QTableWidgetItem(r['serial'] or ''))
            self.table_assets.setItem(row,6,QTableWidgetItem(r['status'] or ''))
        # show id
        self.table_assets.setColumnHidden(0, False)

    def add_asset(self):
        name = self.input_name.text().strip()
        if not name:
            QMessageBox.warning(self, 'Validation', 'Le nom est requis.')
            return
        category = self.input_category.text().strip()
        location = self.input_location.text().strip()
        purchase = self.input_purchase.date().toString('yyyy-MM-dd')
        serial = self.input_serial.text().strip()
        status = self.input_status.currentText()
        self.cur.execute('INSERT INTO assets (name,category,location,purchase_date,serial,status) VALUES (?,?,?,?,?,?)',
                         (name,category,location,purchase,serial,status))
        self.conn.commit()
        QMessageBox.information(self, 'Succès', 'Équipement ajouté.')
        self.clear_asset_form()
        self.load_assets()

    def on_asset_select(self,row, col):
        id_item = self.table_assets.item(row,0)
        if not id_item: return
        aid = id_item.text(); self.current_asset_id = aid
        # load asset details into form
        self.input_name.setText(self.table_assets.item(row,1).text())
        self.input_category.setText(self.table_assets.item(row,2).text())
        self.input_location.setText(self.table_assets.item(row,3).text())
        try:
            pd = self.table_assets.item(row,4).text()
            if pd:
                self.input_purchase.setDate(QDate.fromString(pd,'yyyy-MM-dd'))
        except Exception:
            pass
        self.input_serial.setText(self.table_assets.item(row,5).text())
        st = self.table_assets.item(row,6).text()
        idx = self.input_status.findText(st) if st else 0
        if idx>=0: self.input_status.setCurrentIndex(idx)
        self.current_asset_label.setText(f'Equipement sélectionné: {self.input_name.text()} (ID {aid})')
        # load logs
        self.load_logs(aid)

    def clear_asset_form(self):
        self.input_name.clear(); self.input_category.clear(); self.input_location.clear(); self.input_serial.clear()
        self.input_status.setCurrentIndex(0); self.input_purchase.setDate(QDate.currentDate())
        self.current_asset_id = None
        self.current_asset_label.setText('Aucun équipement sélectionné')

    def edit_asset(self):
        if not self.current_asset_id:
            QMessageBox.warning(self,'Modifier','Sélectionnez un équipement à modifier (clic sur la ligne).')
            return
        aid = self.current_asset_id
        name = self.input_name.text().strip()
        if not name: QMessageBox.warning(self,'Validation','Le nom est requis.'); return
        category = self.input_category.text().strip(); location = self.input_location.text().strip()
        purchase = self.input_purchase.date().toString('yyyy-MM-dd'); serial = self.input_serial.text().strip(); status = self.input_status.currentText()
        self.cur.execute('UPDATE assets SET name=?,category=?,location=?,purchase_date=?,serial=?,status=? WHERE id=?',
                         (name,category,location,purchase,serial,status,aid))
        self.conn.commit()
        QMessageBox.information(self,'Modifier','Équipement mis à jour.')
        self.clear_asset_form(); self.load_assets()

    def delete_asset(self):
        selected = self.table_assets.selectionModel().selectedRows()
        if not selected: QMessageBox.warning(self,'Supprimer','Sélectionnez une ligne.'); return
        ids = [self.table_assets.item(ix.row(),0).text() for ix in selected if self.table_assets.item(ix.row(),0)]
        reply = QMessageBox.question(self,'Confirmer',f'Supprimer {len(ids)} équipement(s) ?')
        if reply != QMessageBox.StandardButton.Yes: return
        q = 'DELETE FROM assets WHERE id IN ({})'.format(','.join('?' for _ in ids))
        self.cur.execute(q,ids); self.conn.commit(); QMessageBox.information(self,'Supprimer','Supprimé.'); self.clear_asset_form(); self.load_assets(); self.table_logs.setRowCount(0)

    # Logs
    def load_logs(self, asset_id):
        self.table_logs.setRowCount(0)
        self.cur.execute('SELECT * FROM maintenance WHERE asset_id=? ORDER BY date DESC',(asset_id,))
        for r in self.cur.fetchall():
            row = self.table_logs.rowCount(); self.table_logs.insertRow(row)
            self.table_logs.setItem(row,0,QTableWidgetItem(str(r['id'])))
            self.table_logs.setItem(row,1,QTableWidgetItem(r['date'] or ''))
            self.table_logs.setItem(row,2,QTableWidgetItem(r['technician'] or ''))
            self.table_logs.setItem(row,3,QTableWidgetItem(r['description'] or ''))
            self.table_logs.setItem(row,4,QTableWidgetItem(str(r['cost'] or '')))
            self.table_logs.setItem(row,5,QTableWidgetItem(str(r['asset_id'])))
        self.table_logs.setColumnHidden(5, True)

    def add_log(self):
        if not self.current_asset_id:
            QMessageBox.warning(self,'Intervention','Sélectionnez d\'abord un équipement.')
            return
        date = self.input_log_date.date().toString('yyyy-MM-dd')
        tech = self.input_tech.text().strip(); desc = self.input_desc.toPlainText().strip(); cost = 0.0
        try:
            cost = float(self.input_cost.text().strip()) if self.input_cost.text().strip() else 0.0
        except ValueError:
            QMessageBox.warning(self,'Validation','Coût invalide. Utilisez un nombre.')
            return
        self.cur.execute('INSERT INTO maintenance (asset_id,date,technician,description,cost) VALUES (?,?,?,?,?)',
                         (self.current_asset_id,date,tech,desc,cost))
        self.conn.commit(); QMessageBox.information(self,'Succès','Intervention ajoutée.'); self.clear_log_form(); self.load_logs(self.current_asset_id)

    def delete_log(self):
        selected = self.table_logs.selectionModel().selectedRows()
        if not selected: QMessageBox.warning(self,'Supprimer','Sélectionnez une intervention.'); return
        ids = [self.table_logs.item(ix.row(),0).text() for ix in selected if self.table_logs.item(ix.row(),0)]
        reply = QMessageBox.question(self,'Confirmer',f'Supprimer {len(ids)} intervention(s) ?')
        if reply != QMessageBox.StandardButton.Yes: return
        q = 'DELETE FROM maintenance WHERE id IN ({})'.format(','.join('?' for _ in ids))
        self.cur.execute(q,ids); self.conn.commit(); QMessageBox.information(self,'Supprimer','Supprimé.'); self.load_logs(self.current_asset_id)

    def clear_log_form(self):
        self.input_log_date.setDate(QDate.currentDate()); self.input_tech.clear(); self.input_cost.clear(); self.input_desc.clear()

    def closeEvent(self,event):
        try: self.conn.close()
        except Exception: pass
        super().closeEvent(event)


if __name__ == '__main__':
    import sys
    app = QApplication(sys.argv)
    win = GMAOApp()
    win.show()
    sys.exit(app.exec())

