// Gestion globale de l'administration UPK
$(document).ready(function() {
    // Charger les données initiales
    loadFacultes();
    loadAllFacultesForSelects();
    
    // Événements de recherche
    $('#searchFacultes').on('keyup', function() {
        searchTable('tableFacultes', $(this).val());
    });
    $('#searchFilieres').on('keyup', function() {
        searchTable('tableFilieres', $(this).val());
    });
    $('#searchPromotions').on('keyup', function() {
        searchTable('tablePromotions', $(this).val());
    });
    $('#searchEtudiants').on('keyup', function() {
        searchTable('tableEtudiants', $(this).val());
    });
    $('#searchEnseignants').on('keyup', function() {
        searchTable('tableEnseignants', $(this).val());
    });
    $('#searchCours').on('keyup', function() {
        searchTable('tableCours', $(this).val());
    });
    $('#searchInscriptions').on('keyup', function() {
        searchTable('tableInscriptions', $(this).val());
    });
    $('#searchPaiements').on('keyup', function() {
        searchTable('tablePaiements', $(this).val());
    });

    // Charger les données lors du changement d'onglet
    $('button[data-bs-toggle="pill"]').on('shown.bs.tab', function(e) {
        const target = $(e.target).attr('data-bs-target');
        switch(target) {
            case '#filieres':
                loadFilieres();
                loadAllFacultesForSelects();
                break;
            case '#promotions':
                loadPromotions();
                loadAllFilieresForSelects();
                break;
            case '#etudiants':
                loadEtudiants();
                loadAllSelectsForEtudiants();
                break;
            case '#enseignants':
                loadEnseignants();
                break;
            case '#cours':
                loadCours();
                loadAllEnseignantsForSelects();
                break;
            case '#inscriptions':
                loadInscriptions();
                loadAllEtudiantsForSelects();
                loadAllPromotionsForSelects();
                break;
            case '#paiements':
                loadPaiements();
                loadAllEtudiantsForSelects();
                break;
        }
    });

    // Cascading selects pour étudiants
    $('#etudiant_faculte_add, #edit_etudiant_faculte').on('change', function() {
        const faculteId = $(this).val();
        const isEdit = $(this).attr('id').includes('edit');
        const filiereSelect = isEdit ? '#edit_etudiant_filiere' : '#etudiant_filiere_add';
        loadFilieresByFaculte(faculteId, filiereSelect);
    });

    $('#etudiant_filiere_add, #edit_etudiant_filiere').on('change', function() {
        const filiereId = $(this).val();
        const isEdit = $(this).attr('id').includes('edit');
        const promotionSelect = isEdit ? '#edit_etudiant_promotion' : '#etudiant_promotion_add';
        loadPromotionsByFiliere(filiereId, promotionSelect);
    });
});

// Fonction de recherche dans les tableaux
function searchTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// Afficher les messages
function showMessage(message, type = 'success') {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $('.card-body').first().prepend(alertHtml);
    setTimeout(() => {
        $('.alert').fadeOut();
    }, 3000);
}

// ===== FACULTÉS =====
function loadFacultes() {
    $.ajax({
        url: 'api/facultes.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let html = '';
            data.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id_faculte}</td>
                        <td><span class="badge bg-primary">${item.code_faculte}</span></td>
                        <td>${item.nom_faculte}</td>
                        <td>${item.doyen || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action" onclick="editFaculte(${item.id_faculte})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deleteFaculte(${item.id_faculte})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $('#tbodyFacultes').html(html);
        }
    });
}

function saveFaculte() {
    const formData = $('#formAddFaculte').serialize();
    $.ajax({
        url: 'api/facultes.php?action=create',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalAddFaculte')).hide();
            $('#formAddFaculte')[0].reset();
            loadFacultes();
            loadAllFacultesForSelects();
            showMessage('Faculté ajoutée avec succès!');
        }
    });
}

function editFaculte(id) {
    $.ajax({
        url: `api/facultes.php?action=get&id=${id}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $('#edit_id_faculte').val(data.id_faculte);
            $('#edit_code_faculte').val(data.code_faculte);
            $('#edit_nom_faculte').val(data.nom_faculte);
            $('#edit_doyen').val(data.doyen);
            new bootstrap.Modal(document.getElementById('modalEditFaculte')).show();
        }
    });
}

function updateFaculte() {
    const formData = $('#formEditFaculte').serialize();
    $.ajax({
        url: 'api/facultes.php?action=update',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditFaculte')).hide();
            loadFacultes();
            loadAllFacultesForSelects();
            showMessage('Faculté mise à jour avec succès!');
        }
    });
}

function deleteFaculte(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette faculté?')) {
        $.ajax({
            url: 'api/facultes.php?action=delete',
            method: 'POST',
            data: { id_faculte: id },
            success: function(response) {
                loadFacultes();
                showMessage('Faculté supprimée avec succès!');
            }
        });
    }
}

function loadAllFacultesForSelects() {
    $.ajax({
        url: 'api/facultes.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let options = '<option value="">Sélectionner une faculté</option>';
            data.forEach(item => {
                options += `<option value="${item.id_faculte}">${item.nom_faculte}</option>`;
            });
            $('#select_faculte_add, #edit_id_faculte, #etudiant_faculte_add, #edit_etudiant_faculte').html(options);
        }
    });
}

// ===== FILIÈRES =====
function loadFilieres() {
    $.ajax({
        url: 'api/filieres.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let html = '';
            data.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id_filiere}</td>
                        <td><span class="badge bg-info">${item.code_filiere}</span></td>
                        <td>${item.nom_filiere}</td>
                        <td>${item.nom_faculte}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action" onclick="editFiliere(${item.id_filiere})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deleteFiliere(${item.id_filiere})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $('#tbodyFilieres').html(html);
        }
    });
}

function saveFiliere() {
    const formData = $('#formAddFiliere').serialize();
    $.ajax({
        url: 'api/filieres.php?action=create',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalAddFiliere')).hide();
            $('#formAddFiliere')[0].reset();
            loadFilieres();
            loadAllFilieresForSelects();
            showMessage('Filière ajoutée avec succès!');
        }
    });
}

function editFiliere(id) {
    $.ajax({
        url: `api/filieres.php?action=get&id=${id}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $('#edit_id_filiere').val(data.id_filiere);
            $('#edit_code_filiere').val(data.code_filiere);
            $('#edit_nom_filiere').val(data.nom_filiere);
            $('#edit_id_faculte').val(data.id_faculte);
            new bootstrap.Modal(document.getElementById('modalEditFiliere')).show();
        }
    });
}

function updateFiliere() {
    const formData = $('#formEditFiliere').serialize();
    $.ajax({
        url: 'api/filieres.php?action=update',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditFiliere')).hide();
            loadFilieres();
            loadAllFilieresForSelects();
            showMessage('Filière mise à jour avec succès!');
        }
    });
}

function deleteFiliere(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette filière?')) {
        $.ajax({
            url: 'api/filieres.php?action=delete',
            method: 'POST',
            data: { id_filiere: id },
            success: function(response) {
                loadFilieres();
                showMessage('Filière supprimée avec succès!');
            }
        });
    }
}

function loadAllFilieresForSelects() {
    $.ajax({
        url: 'api/filieres.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let options = '<option value="">Sélectionner une filière</option>';
            data.forEach(item => {
                options += `<option value="${item.id_filiere}">${item.nom_filiere}</option>`;
            });
            $('#select_filiere_add, #edit_id_filiere_promo').html(options);
        }
    });
}

function loadFilieresByFaculte(faculteId, selectId) {
    if (!faculteId) {
        $(selectId).html('<option value="">Sélectionner une filière</option>');
        return;
    }
    $.ajax({
        url: `api/filieres.php?action=by_faculte&faculte_id=${faculteId}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let options = '<option value="">Sélectionner une filière</option>';
            data.forEach(item => {
                options += `<option value="${item.id_filiere}">${item.nom_filiere}</option>`;
            });
            $(selectId).html(options);
        }
    });
}

// ===== PROMOTIONS =====
function loadPromotions() {
    $.ajax({
        url: 'api/promotions.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let html = '';
            data.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id_promotion}</td>
                        <td><span class="badge bg-success">${item.code_promotion}</span></td>
                        <td>${item.nom_promotion}</td>
                        <td>${item.nom_filiere}</td>
                        <td><span class="badge bg-warning">${item.niveau}</span></td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action" onclick="editPromotion(${item.id_promotion})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deletePromotion(${item.id_promotion})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $('#tbodyPromotions').html(html);
        }
    });
}

function savePromotion() {
    const formData = $('#formAddPromotion').serialize();
    $.ajax({
        url: 'api/promotions.php?action=create',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalAddPromotion')).hide();
            $('#formAddPromotion')[0].reset();
            loadPromotions();
            loadAllPromotionsForSelects();
            showMessage('Promotion ajoutée avec succès!');
        }
    });
}

function editPromotion(id) {
    $.ajax({
        url: `api/promotions.php?action=get&id=${id}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $('#edit_id_promotion').val(data.id_promotion);
            $('#edit_code_promotion').val(data.code_promotion);
            $('#edit_nom_promotion').val(data.nom_promotion);
            $('#edit_id_filiere_promo').val(data.id_filiere);
            $('#edit_niveau').val(data.niveau);
            new bootstrap.Modal(document.getElementById('modalEditPromotion')).show();
        }
    });
}

function updatePromotion() {
    const formData = $('#formEditPromotion').serialize();
    $.ajax({
        url: 'api/promotions.php?action=update',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditPromotion')).hide();
            loadPromotions();
            loadAllPromotionsForSelects();
            showMessage('Promotion mise à jour avec succès!');
        }
    });
}

function deletePromotion(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette promotion?')) {
        $.ajax({
            url: 'api/promotions.php?action=delete',
            method: 'POST',
            data: { id_promotion: id },
            success: function(response) {
                loadPromotions();
                showMessage('Promotion supprimée avec succès!');
            }
        });
    }
}

function loadAllPromotionsForSelects() {
    $.ajax({
        url: 'api/promotions.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let options = '<option value="">Sélectionner une promotion</option>';
            data.forEach(item => {
                options += `<option value="${item.id_promotion}">${item.nom_promotion}</option>`;
            });
            $('#select_promotion_inscr_add, #edit_id_promotion_inscr').html(options);
        }
    });
}

function loadPromotionsByFiliere(filiereId, selectId) {
    if (!filiereId) {
        $(selectId).html('<option value="">Sélectionner une promotion</option>');
        return;
    }
    $.ajax({
        url: `api/promotions.php?action=by_filiere&filiere_id=${filiereId}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let options = '<option value="">Sélectionner une promotion</option>';
            data.forEach(item => {
                options += `<option value="${item.id_promotion}">${item.nom_promotion} (${item.niveau})</option>`;
            });
            $(selectId).html(options);
        }
    });
}

// ===== ÉTUDIANTS =====
function loadEtudiants() {
    $.ajax({
        url: 'api/etudiants.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let html = '';
            data.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id_etudiant}</td>
                        <td><span class="badge bg-primary">${item.matricule}</span></td>
                        <td>${item.nom} ${item.postnom} ${item.prenom || ''}</td>
                        <td>${item.sexe}</td>
                        <td>${item.nom_promotion || '-'}</td>
                        <td>${item.email || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action" onclick="editEtudiant(${item.id_etudiant})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deleteEtudiant(${item.id_etudiant})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $('#tbodyEtudiants').html(html);
        }
    });
}

function loadAllSelectsForEtudiants() {
    loadAllFacultesForSelects();
}

function saveEtudiant() {
    const formData = $('#formAddEtudiant').serialize();
    $.ajax({
        url: 'api/etudiants.php?action=create',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalAddEtudiant')).hide();
            $('#formAddEtudiant')[0].reset();
            loadEtudiants();
            loadAllEtudiantsForSelects();
            showMessage('Étudiant ajouté avec succès!');
        }
    });
}

function editEtudiant(id) {
    $.ajax({
        url: `api/etudiants.php?action=get&id=${id}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $('#edit_id_etudiant').val(data.id_etudiant);
            $('#edit_matricule').val(data.matricule);
            $('#edit_nom').val(data.nom);
            $('#edit_postnom').val(data.postnom);
            $('#edit_prenom').val(data.prenom);
            $('#edit_sexe').val(data.sexe);
            $('#edit_date_naissance').val(data.date_naissance);
            $('#edit_lieu_naissance').val(data.lieu_naissance);
            $('#edit_etudiant_faculte').val(data.id_faculte);
            $('#edit_email').val(data.email);
            $('#edit_telephone').val(data.telephone);
            $('#edit_adresse').val(data.adresse);
            
            // Charger les filières et promotions en cascade
            loadFilieresByFaculte(data.id_faculte, '#edit_etudiant_filiere');
            setTimeout(() => {
                $('#edit_etudiant_filiere').val(data.id_filiere);
                loadPromotionsByFiliere(data.id_filiere, '#edit_etudiant_promotion');
                setTimeout(() => {
                    $('#edit_etudiant_promotion').val(data.id_promotion);
                }, 300);
            }, 300);
            
            new bootstrap.Modal(document.getElementById('modalEditEtudiant')).show();
        }
    });
}

function updateEtudiant() {
    const formData = $('#formEditEtudiant').serialize();
    $.ajax({
        url: 'api/etudiants.php?action=update',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditEtudiant')).hide();
            loadEtudiants();
            loadAllEtudiantsForSelects();
            showMessage('Étudiant mis à jour avec succès!');
        }
    });
}

function deleteEtudiant(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant?')) {
        $.ajax({
            url: 'api/etudiants.php?action=delete',
            method: 'POST',
            data: { id_etudiant: id },
            success: function(response) {
                loadEtudiants();
                showMessage('Étudiant supprimé avec succès!');
            }
        });
    }
}

function loadAllEtudiantsForSelects() {
    $.ajax({
        url: 'api/etudiants.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let options = '<option value="">Sélectionner un étudiant</option>';
            data.forEach(item => {
                options += `<option value="${item.id_etudiant}">${item.matricule} - ${item.nom} ${item.postnom}</option>`;
            });
            $('#select_etudiant_add, #edit_id_etudiant_inscr, #select_etudiant_paiement_add, #edit_id_etudiant_paiement').html(options);
        }
    });
}

// ===== ENSEIGNANTS =====
function loadEnseignants() {
    $.ajax({
        url: 'api/enseignants.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let html = '';
            data.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id_enseignant}</td>
                        <td><span class="badge bg-info">${item.matricule}</span></td>
                        <td>${item.nom} ${item.postnom} ${item.prenom || ''}</td>
                        <td><span class="badge bg-warning">${item.grade}</span></td>
                        <td>${item.email}</td>
                        <td>${item.telephone || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action" onclick="editEnseignant(${item.id_enseignant})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deleteEnseignant(${item.id_enseignant})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $('#tbodyEnseignants').html(html);
        }
    });
}

function saveEnseignant() {
    const formData = $('#formAddEnseignant').serialize();
    $.ajax({
        url: 'api/enseignants.php?action=create',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalAddEnseignant')).hide();
            $('#formAddEnseignant')[0].reset();
            loadEnseignants();
            loadAllEnseignantsForSelects();
            showMessage('Enseignant ajouté avec succès!');
        }
    });
}

function editEnseignant(id) {
    $.ajax({
        url: `api/enseignants.php?action=get&id=${id}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $('#edit_id_enseignant').val(data.id_enseignant);
            $('#edit_matricule_ens').val(data.matricule);
            $('#edit_nom_ens').val(data.nom);
            $('#edit_postnom_ens').val(data.postnom);
            $('#edit_prenom_ens').val(data.prenom);
            $('#edit_grade').val(data.grade);
            $('#edit_email_ens').val(data.email);
            $('#edit_telephone_ens').val(data.telephone);
            $('#edit_specialite').val(data.specialite);
            new bootstrap.Modal(document.getElementById('modalEditEnseignant')).show();
        }
    });
}

function updateEnseignant() {
    const formData = $('#formEditEnseignant').serialize();
    $.ajax({
        url: 'api/enseignants.php?action=update',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditEnseignant')).hide();
            loadEnseignants();
            loadAllEnseignantsForSelects();
            showMessage('Enseignant mis à jour avec succès!');
        }
    });
}

function deleteEnseignant(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enseignant?')) {
        $.ajax({
            url: 'api/enseignants.php?action=delete',
            method: 'POST',
            data: { id_enseignant: id },
            success: function(response) {
                loadEnseignants();
                showMessage('Enseignant supprimé avec succès!');
            }
        });
    }
}

function loadAllEnseignantsForSelects() {
    $.ajax({
        url: 'api/enseignants.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let options = '<option value="">Sélectionner un enseignant</option>';
            data.forEach(item => {
                options += `<option value="${item.id_enseignant}">${item.grade} ${item.nom} ${item.postnom}</option>`;
            });
            $('#select_enseignant_add, #edit_id_enseignant').html(options);
        }
    });
}

// ===== COURS =====
function loadCours() {
    $.ajax({
        url: 'api/cours.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let html = '';
            data.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id_cours}</td>
                        <td><span class="badge bg-success">${item.code_cours}</span></td>
                        <td>${item.intitule}</td>
                        <td><span class="badge bg-info">${item.credits}</span></td>
                        <td>${item.nom_enseignant || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action" onclick="editCours(${item.id_cours})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deleteCours(${item.id_cours})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $('#tbodyCours').html(html);
        }
    });
}

function saveCours() {
    const formData = $('#formAddCours').serialize();
    $.ajax({
        url: 'api/cours.php?action=create',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalAddCours')).hide();
            $('#formAddCours')[0].reset();
            loadCours();
            showMessage('Cours ajouté avec succès!');
        }
    });
}

function editCours(id) {
    $.ajax({
        url: `api/cours.php?action=get&id=${id}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $('#edit_id_cours').val(data.id_cours);
            $('#edit_code_cours').val(data.code_cours);
            $('#edit_intitule').val(data.intitule);
            $('#edit_credits').val(data.credits);
            $('#edit_id_enseignant').val(data.id_enseignant);
            $('#edit_description').val(data.description);
            new bootstrap.Modal(document.getElementById('modalEditCours')).show();
        }
    });
}

function updateCours() {
    const formData = $('#formEditCours').serialize();
    $.ajax({
        url: 'api/cours.php?action=update',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditCours')).hide();
            loadCours();
            showMessage('Cours mis à jour avec succès!');
        }
    });
}

function deleteCours(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours?')) {
        $.ajax({
            url: 'api/cours.php?action=delete',
            method: 'POST',
            data: { id_cours: id },
            success: function(response) {
                loadCours();
                showMessage('Cours supprimé avec succès!');
            }
        });
    }
}

// ===== INSCRIPTIONS =====
function loadInscriptions() {
    $.ajax({
        url: 'api/inscriptions.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let html = '';
            data.forEach(item => {
                const badgeClass = item.statut === 'accepte' ? 'bg-success' : (item.statut === 'refuse' ? 'bg-danger' : 'bg-warning');
                html += `
                    <tr>
                        <td>${item.id_inscription}</td>
                        <td>${item.nom_etudiant}</td>
                        <td>${item.nom_promotion}</td>
                        <td>${item.annee_academique}</td>
                        <td><span class="badge ${badgeClass}">${item.statut}</span></td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action" onclick="editInscription(${item.id_inscription})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deleteInscription(${item.id_inscription})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $('#tbodyInscriptions').html(html);
        }
    });
}

function saveInscription() {
    const formData = $('#formAddInscription').serialize();
    $.ajax({
        url: 'api/inscriptions.php?action=create',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalAddInscription')).hide();
            $('#formAddInscription')[0].reset();
            loadInscriptions();
            showMessage('Inscription enregistrée avec succès!');
        }
    });
}

function editInscription(id) {
    $.ajax({
        url: `api/inscriptions.php?action=get&id=${id}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $('#edit_id_inscription').val(data.id_inscription);
            $('#edit_id_etudiant_inscr').val(data.id_etudiant);
            $('#edit_id_promotion_inscr').val(data.id_promotion);
            $('#edit_annee_academique').val(data.annee_academique);
            $('#edit_date_inscription').val(data.date_inscription);
            $('#edit_statut').val(data.statut);
            new bootstrap.Modal(document.getElementById('modalEditInscription')).show();
        }
    });
}

function updateInscription() {
    const formData = $('#formEditInscription').serialize();
    $.ajax({
        url: 'api/inscriptions.php?action=update',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditInscription')).hide();
            loadInscriptions();
            showMessage('Inscription mise à jour avec succès!');
        }
    });
}

function deleteInscription(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription?')) {
        $.ajax({
            url: 'api/inscriptions.php?action=delete',
            method: 'POST',
            data: { id_inscription: id },
            success: function(response) {
                loadInscriptions();
                showMessage('Inscription supprimée avec succès!');
            }
        });
    }
}

// ===== PAIEMENTS =====
function loadPaiements() {
    $.ajax({
        url: 'api/paiements.php?action=list',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            let html = '';
            data.forEach(item => {
                const badgeClass = item.statut === 'validé' ? 'bg-success' : (item.statut === 'annulé' ? 'bg-danger' : 'bg-warning');
                html += `
                    <tr>
                        <td>${item.id_paiement}</td>
                        <td>${item.nom_etudiant}</td>
                        <td>${item.montant} USD</td>
                        <td>${item.date_paiement}</td>
                        <td>${item.methode_paiement}</td>
                        <td><span class="badge ${badgeClass}">${item.statut}</span></td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action" onclick="editPaiement(${item.id_paiement})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deletePaiement(${item.id_paiement})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $('#tbodyPaiements').html(html);
        }
    });
}

function savePaiement() {
    const formData = $('#formAddPaiement').serialize();
    $.ajax({
        url: 'api/paiements.php?action=create',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalAddPaiement')).hide();
            $('#formAddPaiement')[0].reset();
            loadPaiements();
            showMessage('Paiement enregistré avec succès!');
        }
    });
}

function editPaiement(id) {
    $.ajax({
        url: `api/paiements.php?action=get&id=${id}`,
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $('#edit_id_paiement').val(data.id_paiement);
            $('#edit_id_etudiant_paiement').val(data.id_etudiant);
            $('#edit_montant').val(data.montant);
            $('#edit_date_paiement').val(data.date_paiement);
            $('#edit_methode_paiement').val(data.methode_paiement);
            $('#edit_statut_paiement').val(data.statut);
            $('#edit_numero_recu').val(data.numero_recu);
            $('#edit_remarques').val(data.remarques);
            new bootstrap.Modal(document.getElementById('modalEditPaiement')).show();
        }
    });
}

function updatePaiement() {
    const formData = $('#formEditPaiement').serialize();
    $.ajax({
        url: 'api/paiements.php?action=update',
        method: 'POST',
        data: formData,
        success: function(response) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditPaiement')).hide();
            loadPaiements();
            showMessage('Paiement mis à jour avec succès!');
        }
    });
}

function deletePaiement(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce paiement?')) {
        $.ajax({
            url: 'api/paiements.php?action=delete',
            method: 'POST',
            data: { id_paiement: id },
            success: function(response) {
                loadPaiements();
                showMessage('Paiement supprimé avec succès!');
            }
        });
    }
}

// ===== ANIMATIONS ET EFFETS VISUELS =====

// Animation des cartes au chargement
$(document).ready(function() {
    // Animation au scroll
    animateOnScroll();
    
    // Animation des inputs au focus
    $('.form-control, .form-select').on('focus', function() {
        $(this).parent().addClass('input-focused');
        $(this).animate({
            borderWidth: '3px'
        }, 200);
    }).on('blur', function() {
        $(this).parent().removeClass('input-focused');
        $(this).animate({
            borderWidth: '2px'
        }, 200);
    });

    // Animation des boutons
    $('.btn').on('mouseenter', function() {
        $(this).find('i').addClass('icon-bounce');
    }).on('mouseleave', function() {
        $(this).find('i').removeClass('icon-bounce');
    });

    // Animation des modals à l'ouverture
    $('.modal').on('show.bs.modal', function() {
        $(this).find('.modal-dialog').addClass('modal-slide-in');
    }).on('hidden.bs.modal', function() {
        $(this).find('.modal-dialog').removeClass('modal-slide-in');
    });

    // Effet de ripple sur les boutons
    $('.btn').on('click', function(e) {
        const ripple = $('<span class="ripple"></span>');
        const x = e.pageX - $(this).offset().left;
        const y = e.pageY - $(this).offset().top;
        
        ripple.css({
            left: x + 'px',
            top: y + 'px'
        });
        
        $(this).append(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });

    // Animation des lignes de tableau au survol
    $(document).on('mouseenter', 'tbody tr', function() {
        $(this).addClass('row-hover-effect');
    }).on('mouseleave', 'tbody tr', function() {
        $(this).removeClass('row-hover-effect');
    });

    // Animation de comptage pour les statistiques
    animateNumbers();
    
    // Parallax effect sur l'en-tête
    $(window).on('scroll', function() {
        const scrolled = $(window).scrollTop();
        $('.header-admin').css('transform', 'translateY(' + (scrolled * 0.3) + 'px)');
    });
});

// Animation au scroll
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .tab-pane').forEach(el => {
        observer.observe(el);
    });
}

// Animation de comptage des nombres
function animateNumbers() {
    $('.count-number').each(function() {
        const $this = $(this);
        const target = parseInt($this.text());
        
        $({ counter: 0 }).animate({ counter: target }, {
            duration: 2000,
            easing: 'swing',
            step: function() {
                $this.text(Math.ceil(this.counter));
            }
        });
    });
}

// Notification toast animée
function showMessage(message, type = 'success') {
    const toast = $(`
        <div class="custom-toast ${type}">
            <i class="bi bi-check-circle-fill"></i>
            <span>${message}</span>
        </div>
    `);
    
    $('body').append(toast);
    
    setTimeout(() => {
        toast.addClass('show');
    }, 100);
    
    setTimeout(() => {
        toast.removeClass('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Animation de chargement
function showLoader() {
    const loader = $(`
        <div class="custom-loader">
            <div class="loader-spinner">
                <i class="bi bi-arrow-repeat"></i>
            </div>
            <p>Chargement en cours...</p>
        </div>
    `);
    $('body').append(loader);
    setTimeout(() => loader.addClass('show'), 10);
}

function hideLoader() {
    $('.custom-loader').removeClass('show');
    setTimeout(() => $('.custom-loader').remove(), 300);
}

// Smooth scroll
$('a[href^="#"]').on('click', function(e) {
    e.preventDefault();
    const target = $(this.getAttribute('href'));
    if (target.length) {
        $('html, body').stop().animate({
            scrollTop: target.offset().top - 100
        }, 800, 'swing');
    }
});

// Animation de typing pour les titres
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}


