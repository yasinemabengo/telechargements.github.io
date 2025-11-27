$(document).ready(function() {
    loadFacultes();
    loadAllFilieres();
    loadAllPromotions();
    loadEtudiants();
    loadStatistics();
    
    // Vérifier si on vient d'une inscription
    const urlParams = new URLSearchParams(window.location.search);
    const inscriptionId = urlParams.get('from_inscription');
    if (inscriptionId) {
        loadInscriptionData(inscriptionId);
    }
    
    $('#id_faculte').change(function() {
        loadFilieres($(this).val());
    });
    
    $('#id_filiere').change(function() {
        loadPromotions($(this).val());
    });
    
    $('.form-group').each(function(index) {
        $(this).css('animation-delay', (index * 0.02) + 's');
    });
});

function loadFacultes() {
    $.ajax({
        url: '../api/facultes_api.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const select = $('#id_faculte');
                select.empty();
                select.append('<option value="">-- Sélectionner --</option>');
                response.data.forEach(function(fac) {
                    select.append(`<option value="${fac.id_faculte}">${fac.nom_faculte}</option>`);
                });
            }
        }
    });
}

function loadAllFilieres() {
    $.ajax({
        url: '../api/filieres.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data && data.length > 0) {
                const select = $('#id_filiere');
                select.empty();
                select.append('<option value="">-- Sélectionner une filière --</option>');
                data.forEach(function(fil) {
                    select.append(`<option value="${fil.id_filiere}" data-faculte="${fil.id_faculte}">${fil.nom_filiere} (${fil.code_filiere})</option>`);
                });
            }
        }
    });
}

function loadFilieres(idFaculte) {
    $('#id_filiere').html('<option value="">-- Sélectionner --</option>');
    $('#id_promotion').html('<option value="">-- Sélectionner --</option>');
    
    if (idFaculte) {
        $.ajax({
            url: `../api/filieres.php?action=list`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data && data.length > 0) {
                    const select = $('#id_filiere');
                    data.filter(fil => fil.id_faculte == idFaculte).forEach(function(fil) {
                        select.append(`<option value="${fil.id_filiere}">${fil.nom_filiere}</option>`);
                    });
                }
            }
        });
    }
}

function loadAllPromotions() {
    $.ajax({
        url: '../api/promotions.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data && data.length > 0) {
                const select = $('#id_promotion');
                select.empty();
                select.append('<option value="">-- Sélectionner une promotion --</option>');
                data.forEach(function(promo) {
                    select.append(`<option value="${promo.id_promotion}" data-filiere="${promo.id_filiere}">${promo.niveau}</option>`);
                });
            }
        }
    });
}

function loadPromotions(idFiliere) {
    $('#id_promotion').html('<option value="">-- Sélectionner --</option>');
    
    if (idFiliere) {
        $.ajax({
            url: `../api/promotions.php?action=list`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data && data.length > 0) {
                    const select = $('#id_promotion');
                    data.filter(promo => promo.id_filiere == idFiliere).forEach(function(promo) {
                        select.append(`<option value="${promo.id_promotion}">${promo.niveau}</option>`);
                    });
                }
            }
        });
    }
}

function loadInscriptionData(inscriptionId) {
    $.ajax({
        url: '../api/inscriptions.php?action=get&id=' + inscriptionId,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data) {
                const insc = response.data;
                
                // Pré-remplir les champs d'identité
                $('#nom').val(insc.nom || '');
                $('#postnom').val(insc.postnom || '');
                $('#prenom').val(insc.prenom || '');
                $('#sexe').val(insc.sexe || '');
                $('#date_naissance').val(insc.date_naissance || '');
                $('#lieu_naissance').val(insc.lieu_naissance || '');
                $('#nationalite').val(insc.nationalite || 'Congolaise');
                
                // Pré-remplir les coordonnées
                $('#telephone').val(insc.telephone || '');
                $('#email').val(insc.email || '');
                $('#adresse').val(insc.adresse || '');
                
                // Pré-remplir l'année académique
                $('#annee_academique').val(insc.annee_academique || '');
                
                // Générer un matricule si vide
                if (!$('#matricule').val()) {
                    const year = new Date().getFullYear();
                    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    $('#matricule').val('UPK' + year + random);
                }
                
                // Charger la filière du premier choix
                if (insc.premier_choix) {
                    // Attendre que les filières soient chargées
                    setTimeout(function() {
                        // Trouver l'ID de la filière par son nom
                        $('#id_filiere option').each(function() {
                            if ($(this).text().includes(insc.premier_choix)) {
                                const filiereId = $(this).val();
                                const faculteId = $(this).data('faculte');
                                
                                // Sélectionner la faculté d'abord
                                if (faculteId) {
                                    $('#id_faculte').val(faculteId).trigger('change');
                                    
                                    // Attendre que les filières de la faculté soient chargées
                                    setTimeout(function() {
                                        $('#id_filiere').val(filiereId).trigger('change');
                                    }, 300);
                                }
                            }
                        });
                    }, 500);
                }
                
                // Afficher un message d'information
                const alertDiv = $('<div class="alert alert-info alert-dismissible fade show" role="alert">' +
                    '<i class="bi bi-info-circle"></i> <strong>Transfert d\'inscription :</strong> ' +
                    'Les données de l\'inscription ont été pré-remplies. Vérifiez et complétez les informations manquantes.' +
                    '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
                    '</div>');
                $('#formAddEtudiant').before(alertDiv);
                
                // Faire défiler vers le haut du formulaire
                $('html, body').animate({ scrollTop: 0 }, 300);
            } else {
                alert('Erreur lors du chargement des données de l\'inscription.');
            }
        },
        error: function() {
            alert('Erreur de connexion lors du chargement de l\'inscription.');
        }
    });
}

function loadEtudiants() {
    $.ajax({
        url: '../api/etudiants.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const tbody = $('#tbodyEtudiants');
            tbody.empty();
            
            if (!data || data.length === 0) {
                tbody.append(`
                    <tr>
                        <td colspan="7" class="text-center text-muted">
                            <i class="bi bi-inbox"></i> Aucun étudiant enregistré
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

$('#formAddEtudiant').on('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const action = $('#id_etudiant').val() ? 'update' : 'create';
    formData.set('action', action);
    
    // Ajouter l'ID de l'inscription si on vient d'un transfert
    const urlParams = new URLSearchParams(window.location.search);
    const inscriptionId = urlParams.get('from_inscription');
    if (inscriptionId && action === 'create') {
        formData.set('inscription_id', inscriptionId);
    }
    
    // Log pour debug
    console.log('Envoi du formulaire - Action:', action);
    console.log('Données du formulaire:', Object.fromEntries(formData));
    
    $.ajax({
        url: '../api/etudiants.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            console.log('Réponse du serveur:', response);
            if (response.success) {
                const message = action === 'create' ? 'Étudiant ajouté avec succès' : 'Étudiant modifié avec succès';
                alert(message);
                
                // Si on vient d'une inscription, proposer de retourner à la liste des inscriptions
                if (inscriptionId && action === 'create') {
                    if (confirm(message + '\n\nVoulez-vous retourner à la liste des inscriptions ?')) {
                        window.location.href = 'ajout_inscription.php';
                        return;
                    }
                }
                
                resetForm();
                loadEtudiants();
                loadStatistics(); // Recharger les statistiques
                
                // Nettoyer l'URL
                if (inscriptionId) {
                    window.history.replaceState({}, document.title, 'ajout_etudiant.php');
                }
            } else {
                alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
                console.error('Erreur serveur:', response);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erreur AJAX:', error);
            console.error('Statut:', status);
            console.error('Réponse du serveur:', xhr.responseText);
            
            // Essayer de parser la réponse JSON
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                alert('Erreur lors de l\'enregistrement: ' + (errorResponse.message || error));
            } catch(e) {
                alert('Erreur lors de l\'enregistrement: ' + error + '\n\nDétails dans la console (F12)');
            }
        }
    });
});

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
                                            <img src="../api/etudiants.php?action=getPhoto&id=${etu.id_etudiant}" 
                                                 alt="Photo de ${etu.prenom} ${etu.nom}" 
                                                 class="img-thumbnail mt-2" 
                                                 style="max-width: 250px; max-height: 300px;"
                                                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23999%22%3EAucune photo%3C/text%3E%3C/svg%3E';">
                                        </div>
                                        <div class="col-md-6 text-center mb-3">
                                            <strong><i class="bi bi-file-pdf"></i> Dossier:</strong><br>
                                            <a href="../api/etudiants.php?action=getDossiers&id=${etu.id_etudiant}" 
                                               target="_blank" 
                                               class="btn btn-outline-danger mt-2"
                                               onclick="return checkDossierExists(${etu.id_etudiant});">
                                                <i class="bi bi-file-pdf"></i> Consulter le dossier PDF
                                            </a>
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
                $('#id_etudiant').val(etu.id_etudiant);
                $('#matricule').val(etu.matricule);
                $('#nom').val(etu.nom);
                $('#postnom').val(etu.postnom);
                $('#prenom').val(etu.prenom);
                $('#sexe').val(etu.sexe);
                $('#date_naissance').val(etu.date_naissance);
                $('#lieu_naissance').val(etu.lieu_naissance);
                $('#nationalite').val(etu.nationalite);
                $('#id_faculte').val(etu.id_faculte);
                
                // Charger les filières puis sélectionner
                loadFilieres(etu.id_faculte);
                setTimeout(() => {
                    $('#id_filiere').val(etu.id_filiere);
                    loadPromotions(etu.id_filiere);
                    setTimeout(() => {
                        $('#id_promotion').val(etu.id_promotion);
                    }, 300);
                }, 300);
                
                $('#annee_academique').val(etu.annee_academique);
                $('#telephone').val(etu.telephone);
                $('#email').val(etu.email);
                $('#adresse').val(etu.adresse);
                $('#nom_pere').val(etu.nom_pere);
                $('#nom_mere').val(etu.nom_mere);
                $('#telephone_urgence').val(etu.telephone_urgence);
                $('#statut').val(etu.statut);
                
                $('button[type="submit"]').html('<i class="bi bi-check-circle"></i> Modifier');
                
                $('html, body').animate({
                    scrollTop: $('#formAddEtudiant').offset().top - 100
                }, 500);
            }
        },
        error: function() {
            alert('Erreur lors du chargement de l\'étudiant');
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
                    loadStatistics(); // Recharger les statistiques
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

function resetForm() {
    $('#formAddEtudiant')[0].reset();
    $('#id_etudiant').val('');
    $('#action').val('create');
    $('button[type="submit"]').html('<i class="bi bi-check-circle"></i> Enregistrer');
}

// Recherche dans le tableau
$('#searchEtudiants').on('keyup', function() {
    const value = $(this).val().toLowerCase();
    $('#tbodyEtudiants tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});

// Fonction pour vérifier l'existence d'un dossier
function checkDossierExists(id) {
    // Cette fonction retourne true pour permettre l'ouverture du lien
    // Si le dossier n'existe pas, le serveur renverra une 404
    return true;
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
