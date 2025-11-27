$(document).ready(function() {
    loadEtudiants();
    loadFacultesInModals();
    loadStatistics();
    loadFilterOptions();
    
    // Événements de filtrage
    $('#filterFaculte, #filterFiliere, #filterPromotion, #filterAnnee').on('change', function() {
        applyFilters();
    });
});

// Charger les options de filtres
function loadFilterOptions() {
    // Charger les facultés
    $.ajax({
        url: '../api/facultes_api.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const select = $('#filterFaculte');
                select.empty().append('<option value="">Toutes les facultés</option>');
                response.data.forEach(function(fac) {
                    select.append(`<option value="${fac.id_faculte}">${fac.nom_faculte}</option>`);
                });
            }
        }
    });
    
    // Charger les filières
    $.ajax({
        url: '../api/filieres.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data && Array.isArray(data)) {
                const select = $('#filterFiliere');
                select.empty().append('<option value="">Toutes les filières</option>');
                data.forEach(function(fil) {
                    select.append(`<option value="${fil.id_filiere}">${fil.nom_filiere}</option>`);
                });
            }
        }
    });
    
    // Charger les promotions
    $.ajax({
        url: '../api/promotions.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data && Array.isArray(data)) {
                const select = $('#filterPromotion');
                select.empty().append('<option value="">Toutes les promotions</option>');
                data.forEach(function(prom) {
                    select.append(`<option value="${prom.id_promotion}">${prom.code_promotion} - ${prom.niveau}</option>`);
                });
            }
        }
    });
    
    // Charger les années académiques uniques
    $.ajax({
        url: '../api/etudiants.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data && data.length > 0) {
                const annees = [...new Set(data.map(etu => etu.annee_academique).filter(a => a))];
                const select = $('#filterAnnee');
                select.empty().append('<option value="">Toutes les années</option>');
                annees.sort().reverse().forEach(function(annee) {
                    select.append(`<option value="${annee}">${annee}</option>`);
                });
            }
        }
    });
}

// Appliquer les filtres
function applyFilters() {
    const faculte = $('#filterFaculte').val();
    const filiere = $('#filterFiliere').val();
    const promotion = $('#filterPromotion').val();
    const annee = $('#filterAnnee').val();
    
    $.ajax({
        url: '../api/etudiants.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (!data || data.length === 0) {
                $('#tbodyEtudiants').html(`
                    <tr>
                        <td colspan="7" class="text-center text-muted">
                            <i class="bi bi-inbox"></i> Aucun étudiant enregistré
                        </td>
                    </tr>
                `);
                return;
            }
            
            // Filtrer les données
            let filteredData = data;
            
            if (faculte) {
                filteredData = filteredData.filter(etu => etu.id_faculte == faculte);
            }
            if (filiere) {
                filteredData = filteredData.filter(etu => etu.id_filiere == filiere);
            }
            if (promotion) {
                filteredData = filteredData.filter(etu => etu.id_promotion == promotion);
            }
            if (annee) {
                filteredData = filteredData.filter(etu => etu.annee_academique === annee);
            }
            
            // Afficher les résultats
            displayEtudiants(filteredData);
        }
    });
}

// Afficher les étudiants dans le tableau
function displayEtudiants(data) {
    const tbody = $('#tbodyEtudiants');
    tbody.empty();
    
    if (!data || data.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="bi bi-filter-circle"></i> Aucun étudiant trouvé avec ces filtres
                </td>
            </tr>
        `);
        return;
    }
    
    data.forEach(function(etu) {
        const fullName = `${etu.prenom} ${etu.nom} ${etu.postnom}`;
        const statusBadge = etu.statut === 'Actif' ? 'bg-success' : 
                           etu.statut === 'Diplômé' ? 'bg-primary' : 
                           etu.statut === 'Suspendu' ? 'bg-warning' : 'bg-danger';
        
        tbody.append(`
            <tr>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-info" onclick="viewEtudiant(${etu.id_etudiant})" title="Voir plus">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-success" onclick="generateCard(${etu.id_etudiant})" title="Générer carte">
                            <i class="bi bi-credit-card"></i>
                        </button>
                        <button class="btn btn-warning" onclick="editEtudiant(${etu.id_etudiant})" title="Modifier">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteEtudiant(${etu.id_etudiant})" title="Supprimer">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
                <td><span class="badge bg-primary">${etu.matricule}</span></td>
                <td>${fullName}</td>
                <td>${etu.sexe}</td>
                <td>${etu.code_promotion ? `${etu.code_promotion} (${etu.niveau})` : 'N/A'}</td>
                <td>${etu.telephone || '-'}</td>
                <td><span class="badge ${statusBadge}">${etu.statut}</span></td>
            </tr>
        `);
    });
}

function loadFacultesInModals() {
    // Charger les facultés
    $.ajax({
        url: '../api/facultes_api.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const selectAdd = $('#etudiant_faculte_add');
                const selectEdit = $('#edit_etudiant_faculte');
                
                selectAdd.empty();
                selectEdit.empty();
                
                selectAdd.append('<option value="">Sélectionner une faculté</option>');
                selectEdit.append('<option value="">Sélectionner une faculté</option>');
                
                response.data.forEach(function(fac) {
                    selectAdd.append(`<option value="${fac.id_faculte}">${fac.nom_faculte}</option>`);
                    selectEdit.append(`<option value="${fac.id_faculte}">${fac.nom_faculte}</option>`);
                });
            }
        }
    });
    
    // Charger les filières
    $.ajax({
        url: '../api/filieres.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data && Array.isArray(data)) {
                const selectAdd = $('#etudiant_filiere_add');
                const selectEdit = $('#edit_etudiant_filiere');
                
                selectAdd.empty();
                selectEdit.empty();
                
                selectAdd.append('<option value="">Sélectionner une filière</option>');
                selectEdit.append('<option value="">Sélectionner une filière</option>');
                
                data.forEach(function(fil) {
                    selectAdd.append(`<option value="${fil.id_filiere}">${fil.nom_filiere}</option>`);
                    selectEdit.append(`<option value="${fil.id_filiere}">${fil.nom_filiere}</option>`);
                });
            }
        }
    });
    
    // Charger les promotions
    $.ajax({
        url: '../api/promotions.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data && Array.isArray(data)) {
                const selectAdd = $('#etudiant_promotion_add');
                const selectEdit = $('#edit_etudiant_promotion');
                
                selectAdd.empty();
                selectEdit.empty();
                
                selectAdd.append('<option value="">Sélectionner une promotion</option>');
                selectEdit.append('<option value="">Sélectionner une promotion</option>');
                
                data.forEach(function(prom) {
                    selectAdd.append(`<option value="${prom.id_promotion}">${prom.code_promotion} - ${prom.niveau}</option>`);
                    selectEdit.append(`<option value="${prom.id_promotion}">${prom.code_promotion} - ${prom.niveau}</option>`);
                });
            }
        }
    });
}

function loadEtudiants() {
    $.ajax({
        url: '../api/etudiants.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            displayEtudiants(data);
        },
        error: function(xhr, status, error) {
            console.error('Erreur:', error);
            $('#tbodyEtudiants').html(`
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle"></i> Erreur lors du chargement
                    </td>
                </tr>
            `);
        }
    });
}

function viewEtudiant(id) {
    // Stocker l'ID pour l'utiliser dans le bouton de génération de carte
    window.currentEtudiantId = id;
    
    $.ajax({
        url: '../api/etudiants.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(etu) {
            if (etu) {
                const modalBody = $('#modalBodyDetailsEtudiant');
                
                const statusColor = etu.statut === 'Actif' ? 'success' : 
                                   etu.statut === 'Diplômé' ? 'primary' : 
                                   etu.statut === 'Suspendu' ? 'warning' : 'danger';
                
                modalBody.html(`
                    <div class="row">
                        <div class="col-12">
                            <!-- Section Photo et Dossiers -->
                            <div class="card mb-3">
                                <div class="card-header bg-secondary text-white">
                                    <h6 class="mb-0"><i class="bi bi-folder2-open"></i> Documents</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 text-center mb-3">
                                            <strong><i class="bi bi-camera"></i> Photo:</strong><br>
                                            ${etu.has_photo ? `
                                                <img src="../api/etudiants.php?action=getPhoto&id=${etu.id_etudiant}" 
                                                     alt="Photo de ${etu.prenom} ${etu.nom}" 
                                                     class="img-thumbnail mt-2" 
                                                     style="max-width: 250px; max-height: 300px;"
                                                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23999%22%3EAucune photo%3C/text%3E%3C/svg%3E';">
                                            ` : `
                                                <div class="mt-2 p-4 bg-light border rounded">
                                                    <i class="bi bi-image" style="font-size: 3rem; color: #ccc;"></i>
                                                    <p class="text-muted mb-0">Aucune photo</p>
                                                </div>
                                            `}
                                        </div>
                                        <div class="col-md-6 text-center mb-3">
                                            <strong><i class="bi bi-file-pdf"></i> Dossier:</strong><br>
                                            ${etu.has_dossiers ? `
                                                <a href="../api/etudiants.php?action=getDossiers&id=${etu.id_etudiant}" 
                                                   target="_blank" 
                                                   class="btn btn-outline-danger mt-2">
                                                    <i class="bi bi-file-pdf"></i> Consulter le dossier PDF
                                                </a>
                                            ` : `
                                                <div class="mt-2 p-4 bg-light border rounded">
                                                    <i class="bi bi-file-earmark-x" style="font-size: 3rem; color: #ccc;"></i>
                                                    <p class="text-muted mb-0">Aucun dossier</p>
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Section Identité -->
                            <div class="card mb-3">
                                <div class="card-header bg-primary text-white">
                                    <h6 class="mb-0"><i class="bi bi-person-badge"></i> Identité</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-hash"></i> ID:</strong> ${etu.id_etudiant}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-card-text"></i> Matricule:</strong> <span class="badge bg-primary">${etu.matricule}</span>
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-gender-ambiguous"></i> Sexe:</strong> ${etu.sexe}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-toggle-on"></i> Statut:</strong> <span class="badge bg-${statusColor}">${etu.statut}</span>
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-person"></i> Nom:</strong> ${etu.nom}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-person-lines-fill"></i> Postnom:</strong> ${etu.postnom}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-person-fill"></i> Prénom:</strong> ${etu.prenom}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-calendar-event"></i> Date de Naissance:</strong> ${etu.date_naissance || 'N/A'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-geo-alt"></i> Lieu de Naissance:</strong> ${etu.lieu_naissance || 'N/A'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-flag"></i> Nationalité:</strong> ${etu.nationalite || 'Congolaise'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Section Affectation Académique -->
                            <div class="card mb-3">
                                <div class="card-header bg-success text-white">
                                    <h6 class="mb-0"><i class="bi bi-mortarboard"></i> Affectation Académique</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-building"></i> Faculté:</strong> ${etu.nom_faculte || 'Non affectée'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-book"></i> Filière:</strong> ${etu.nom_filiere || 'Non affectée'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-people"></i> Promotion:</strong> ${etu.code_promotion ? `${etu.code_promotion} (${etu.niveau})` : 'Non affectée'}
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <strong><i class="bi bi-calendar3"></i> Année Académique:</strong> ${etu.annee_academique || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Section Coordonnées -->
                            <div class="card mb-3">
                                <div class="card-header bg-info text-white">
                                    <h6 class="mb-0"><i class="bi bi-telephone"></i> Coordonnées</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-phone"></i> Téléphone:</strong> ${etu.telephone || 'Non défini'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-envelope"></i> Email:</strong> ${etu.email || 'Non défini'}
                                        </div>
                                        <div class="col-md-12 mb-2">
                                            <strong><i class="bi bi-house"></i> Adresse:</strong> ${etu.adresse || 'Non définie'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Section Informations Familiales -->
                            <div class="card mb-3">
                                <div class="card-header bg-warning text-dark">
                                    <h6 class="mb-0"><i class="bi bi-people-fill"></i> Informations Familiales</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-person-badge"></i> Nom du Père:</strong> ${etu.nom_pere || 'Non défini'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-person-heart"></i> Nom de la Mère:</strong> ${etu.nom_mere || 'Non défini'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-telephone-forward"></i> Téléphone Urgence:</strong> ${etu.telephone_urgence || 'Non défini'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Section Timestamps -->
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class="bi bi-clock-history"></i> Historique</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-2">
                                            <strong><i class="bi bi-calendar-plus"></i> Date d'Inscription:</strong> ${etu.date_inscription || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                
                const modal = new bootstrap.Modal(document.getElementById('modalDetailsEtudiant'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement des détails de l\'étudiant');
        }
    });
}

function editEtudiant(id) {
    $.ajax({
        url: '../api/etudiants.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(etu) {
            if (etu) {
                $('#edit_id_etudiant').val(etu.id_etudiant);
                $('#edit_matricule').val(etu.matricule);
                $('#edit_nom').val(etu.nom);
                $('#edit_postnom').val(etu.postnom);
                $('#edit_prenom').val(etu.prenom);
                $('#edit_sexe_etu').val(etu.sexe);
                $('#edit_date_naissance_etu').val(etu.date_naissance);
                $('#edit_lieu_naissance').val(etu.lieu_naissance);
                $('#edit_nationalite_etu').val(etu.nationalite);
                $('#edit_id_faculte_etu').val(etu.id_faculte);
                $('#edit_id_filiere_etu').val(etu.id_filiere);
                $('#edit_id_promotion_etu').val(etu.id_promotion);
                $('#edit_annee_academique_etu').val(etu.annee_academique);
                $('#edit_email').val(etu.email);
                $('#edit_telephone_etu').val(etu.telephone);
                $('#edit_adresse_etu').val(etu.adresse);
                $('#edit_nom_pere').val(etu.nom_pere);
                $('#edit_nom_mere').val(etu.nom_mere);
                $('#edit_telephone_urgence').val(etu.telephone_urgence);
                $('#edit_statut_etu').val(etu.statut);
                
                const modal = new bootstrap.Modal(document.getElementById('modalEditEtudiant'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement de l\'étudiant');
        }
    });
}

function saveEtudiant() {
    const formData = new FormData(document.getElementById('formAddEtudiant'));
    formData.append('action', 'create');
    
    $.ajax({
        url: '../api/etudiants.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Étudiant ajouté avec succès');
                bootstrap.Modal.getInstance(document.getElementById('modalAddEtudiant')).hide();
                document.getElementById('formAddEtudiant').reset();
                loadEtudiants();
                loadStatistics();
            } else {
                alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
            }
        },
        error: function() {
            alert('Erreur lors de l\'enregistrement');
        }
    });
}

function updateEtudiant() {
    const formData = new FormData(document.getElementById('formEditEtudiant'));
    formData.append('action', 'update');
    
    $.ajax({
        url: '../api/etudiants.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Étudiant modifié avec succès');
                bootstrap.Modal.getInstance(document.getElementById('modalEditEtudiant')).hide();
                loadEtudiants();
                loadStatistics();
            } else {
                alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
            }
        },
        error: function() {
            alert('Erreur lors de la modification');
        }
    });
}

function deleteEtudiant(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
        $.ajax({
            url: '../api/etudiants.php',
            method: 'POST',
            data: { action: 'delete', id_etudiant: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('Étudiant supprimé avec succès');
                    loadEtudiants();
                    loadStatistics();
                } else {
                    alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
                }
            },
            error: function() {
                alert('Erreur lors de la suppression');
            }
        });
    }
}

// Recherche dans le tableau
$('#searchEtudiants').on('keyup', function() {
    const value = $(this).val().toLowerCase();
    $('#tbodyEtudiants tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});

// Réinitialiser les filtres
function resetFilters() {
    $('#filterFaculte, #filterFiliere, #filterPromotion, #filterAnnee').val('');
    loadEtudiants();
}

// Charger les statistiques
function loadStatistics() {
    $.ajax({
        url: '../api/etudiants.php?action=statistics',
        method: 'GET',
        dataType: 'json',
        success: function(stats) {
            displayStatistics(stats);
        },
        error: function(xhr, status, error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            $('#statsContainer').html(`
                <div class="col-md-12">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i> Erreur lors du chargement des statistiques
                    </div>
                </div>
            `);
        }
    });
}

function displayStatistics(stats) {
    let html = `
        <!-- Statistique générale -->
        <div class="col-md-3 mb-3">
            <div class="card text-white bg-primary h-100">
                <div class="card-body">
                    <h5 class="card-title"><i class="bi bi-people-fill"></i> Total Étudiants</h5>
                    <h2 class="mb-0">${stats.total}</h2>
                </div>
            </div>
        </div>
        
        <!-- Statistiques par statut -->
        <div class="col-md-3 mb-3">
            <div class="card h-100">
                <div class="card-header bg-success text-white">
                    <strong><i class="bi bi-toggle-on"></i> Par Statut</strong>
                </div>
                <div class="card-body p-2">
                    <div class="list-group list-group-flush">
    `;
    
    stats.par_statut.forEach(function(item) {
        const badgeColor = item.statut === 'Actif' ? 'success' : 
                          item.statut === 'Diplômé' ? 'primary' : 
                          item.statut === 'Suspendu' ? 'warning' : 'danger';
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center p-2">
                <small>${item.statut}</small>
                <span class="badge bg-${badgeColor} rounded-pill">${item.nombre}</span>
            </div>
        `;
    });
    
    html += `
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistiques par faculté -->
        <div class="col-md-3 mb-3">
            <div class="card h-100">
                <div class="card-header bg-info text-white">
                    <strong><i class="bi bi-building"></i> Par Faculté</strong>
                </div>
                <div class="card-body p-2" style="max-height: 200px; overflow-y: auto;">
                    <div class="list-group list-group-flush">
    `;
    
    stats.par_faculte.forEach(function(item) {
        if (item.nombre > 0) {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center p-2">
                    <small>${item.nom_faculte}</small>
                    <span class="badge bg-info rounded-pill">${item.nombre}</span>
                </div>
            `;
        }
    });
    
    html += `
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistiques par filière -->
        <div class="col-md-3 mb-3">
            <div class="card h-100">
                <div class="card-header bg-warning text-dark">
                    <strong><i class="bi bi-book"></i> Par Filière</strong>
                </div>
                <div class="card-body p-2" style="max-height: 200px; overflow-y: auto;">
                    <div class="list-group list-group-flush">
    `;
    
    stats.par_filiere.forEach(function(item) {
        if (item.nombre > 0) {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center p-2">
                    <small>${item.code_filiere}</small>
                    <span class="badge bg-warning text-dark rounded-pill">${item.nombre}</span>
                </div>
            `;
        }
    });
    
    html += `
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistiques par promotion -->
        <div class="col-md-12 mb-3">
            <div class="card">
                <div class="card-header bg-secondary text-white">
                    <strong><i class="bi bi-people"></i> Par Promotion</strong>
                </div>
                <div class="card-body p-2">
                    <div class="row">
    `;
    
    stats.par_promotion.forEach(function(item) {
        if (item.nombre > 0) {
            html += `
                <div class="col-md-2 col-sm-4 col-6 mb-2">
                    <div class="card text-center">
                        <div class="card-body p-2">
                            <small class="text-muted">${item.code_promotion}</small>
                            <h5 class="mb-0">${item.nombre}</h5>
                            <small>${item.niveau}</small>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    html += `
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#statsContainer').html(html);
}

// Générer la carte d'étudiant
function generateCard(id) {
    window.open('../card/card_etudiant_tcpdf.php?id=' + id, '_blank');
}
