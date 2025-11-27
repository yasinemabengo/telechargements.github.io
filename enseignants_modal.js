$(document).ready(function() {
    loadEnseignants();
    
    // Changement du nombre d'éléments par page
    $('#itemsPerPage').on('change', function() {
        currentPage = 1;
        displayEnseignants();
    });
});

let allEnseignants = [];
let filteredEnseignants = [];
let currentPage = 1;

function loadEnseignants() {
    $.ajax({
        url: '../api/enseignants.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            allEnseignants = data || [];
            filteredEnseignants = allEnseignants;
            $('#totalEnseignants').text(allEnseignants.length + ' enseignant' + (allEnseignants.length > 1 ? 's' : ''));
            currentPage = 1;
            displayEnseignants();
        },
        error: function(xhr, status, error) {
            console.error('Erreur:', error);
            $('#tbodyEnseignants').html(`
                <tr>
                    <td colspan="25" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle"></i> Erreur lors du chargement
                    </td>
                </tr>
            `);
            $('#totalEnseignants').text('0 enseignants');
        }
    });
}

function displayEnseignants() {
    const tbody = $('#tbodyEnseignants');
    tbody.empty();
    
    if (!filteredEnseignants || filteredEnseignants.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="25" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> Aucun enseignant trouvé
                </td>
            </tr>
        `);
        $('#showingInfo').text('Affichage de 0 à 0 sur 0 entrées');
        $('#pagination').empty();
        return;
    }
    
    const itemsPerPage = $('#itemsPerPage').val();
    const totalItems = filteredEnseignants.length;
    let startIndex, endIndex, totalPages;
    
    if (itemsPerPage === 'all') {
        startIndex = 0;
        endIndex = totalItems;
        totalPages = 1;
    } else {
        const perPage = parseInt(itemsPerPage);
        totalPages = Math.ceil(totalItems / perPage);
        
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        
        startIndex = (currentPage - 1) * perPage;
        endIndex = Math.min(startIndex + perPage, totalItems);
    }
    
    // Afficher les éléments de la page courante
    for (let i = startIndex; i < endIndex; i++) {
        const ens = filteredEnseignants[i];
        const statusBadge = ens.statut === 'Actif' ? 'bg-success' : 
                           ens.statut === 'Suspendu' ? 'bg-warning' : 
                           ens.statut === 'Retraité' ? 'bg-info' : 'bg-secondary';
        const emploiBadge = ens.statut_emploi === 'Permanent' ? 'bg-success' : 
                           ens.statut_emploi === 'Vacataire' ? 'bg-warning' : 
                           ens.statut_emploi === 'Contractuel' ? 'bg-info' : 'bg-secondary';
        
        tbody.append(`
            <tr>
                <td style="position: sticky; left: 0; background-color: #fff; z-index: 1;">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-info" onclick="viewEnseignant(${ens.id_enseignant})" title="Voir plus">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-warning" onclick="window.location.href='../views/ajout_enseignant.php'" title="Modifier">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteEnseignant(${ens.id_enseignant})" title="Supprimer">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
                <td><strong>${ens.id_enseignant || ''}</strong></td>
                <td><span class="badge bg-primary">${ens.matricule_enseignant || 'N/A'}</span></td>
                <td>${ens.nom || 'N/A'}</td>
                <td>${ens.postnom || 'N/A'}</td>
                <td>${ens.prenom || 'N/A'}</td>
                <td><span class="badge ${ens.sexe === 'Masculin' ? 'bg-primary' : 'bg-danger'}">${ens.sexe || 'N/A'}</span></td>
                <td>${ens.date_naissance || 'N/A'}</td>
                <td>${ens.lieu_naissance || 'N/A'}</td>
                <td>${ens.nationalite || 'N/A'}</td>
                <td><span class="badge bg-info">${ens.grade || 'N/A'}</span></td>
                <td>${ens.specialite || 'N/A'}</td>
                <td>${ens.diplome_obtenu || 'N/A'}</td>
                <td>${ens.annee_obtention_diplome || 'N/A'}</td>
                <td>${ens.universite_origine || 'N/A'}</td>
                <td><strong>${ens.nom_faculte || 'Non affecté'}</strong></td>
                <td>${ens.departement || 'N/A'}</td>
                <td><span class="badge ${emploiBadge}">${ens.statut_emploi || 'N/A'}</span></td>
                <td>${ens.adresse || 'N/A'}</td>
                <td>${ens.telephone || 'N/A'}</td>
                <td>${ens.email || 'N/A'}</td>
                <td>${ens.date_engagement || 'N/A'}</td>
                <td>${ens.numero_ordre || 'N/A'}</td>
                <td><span class="badge ${statusBadge}">${ens.statut || 'Actif'}</span></td>
                <td>${ens.numero_compte || 'N/A'} ${ens.banque ? '(' + ens.banque + ')' : ''}</td>
            </tr>
        `);
    }
    
    // Mise à jour de l'info d'affichage
    $('#showingInfo').text(`Affichage de ${startIndex + 1} à ${endIndex} sur ${totalItems} entrées`);
    
    // Génération de la pagination
    if (itemsPerPage !== 'all') {
        generatePagination(totalPages);
    } else {
        $('#pagination').empty();
    }
}

function generatePagination(totalPages) {
    const pagination = $('#pagination');
    pagination.empty();
    
    if (totalPages <= 1) return;
    
    // Bouton Précédent
    pagination.append(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `);
    
    // Numéros de page
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        pagination.append(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
            </li>
        `);
        if (startPage > 2) {
            pagination.append(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pagination.append(`
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagination.append(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
        }
        pagination.append(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `);
    }
    
    // Bouton Suivant
    pagination.append(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `);
}

function changePage(page) {
    currentPage = page;
    displayEnseignants();
    $('html, body').animate({
        scrollTop: $('#tableEnseignants').offset().top - 100
    }, 300);
}

// Recherche dans le tableau
$('#searchEnseignants').on('keyup', function() {
    const value = $(this).val().toLowerCase();
    
    if (value === '') {
        filteredEnseignants = allEnseignants;
    } else {
        filteredEnseignants = allEnseignants.filter(function(ens) {
            return JSON.stringify(ens).toLowerCase().includes(value);
        });
    }
    
    currentPage = 1;
    displayEnseignants();
});

function viewEnseignant(id) {
    $.ajax({
        url: '../api/enseignants.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(ens) {
            if (ens) {
                const modalBody = $('#modalBodyDetails');
                const fullName = `${ens.prenom || ''} ${ens.nom || ''} ${ens.postnom || ''}`.trim();
                
                const statusBadge = ens.statut === 'Actif' ? 'success' : 
                                   ens.statut === 'Suspendu' ? 'warning' : 
                                   ens.statut === 'Retraité' ? 'info' : 'secondary';
                
                const emploiBadge = ens.statut_emploi === 'Permanent' ? 'success' : 
                                   ens.statut_emploi === 'Vacataire' ? 'warning' : 
                                   ens.statut_emploi === 'Contractuel' ? 'info' : 'secondary';
                
                modalBody.html(`
                    <div class="row">
                        <!-- Photo et informations principales -->
                        <div class="col-md-3 text-center mb-4">
                            <div class="card">
                                <div class="card-body">
                                    ${ens.photo ? `<img src="../uploads/${ens.photo}" class="img-fluid rounded mb-3" style="max-height: 250px;" alt="Photo">` : '<div class="bg-secondary text-white rounded d-flex align-items-center justify-content-center mb-3" style="height: 250px; font-size: 80px;"><i class="bi bi-person-circle"></i></div>'}
                                    <h4 class="mb-2">${fullName}</h4>
                                    <p class="text-muted mb-2 fs-5">${ens.grade || 'N/A'}</p>
                                    <p class="mb-2"><span class="badge bg-primary fs-6">${ens.matricule_enseignant || 'N/A'}</span></p>
                                    <p class="mb-0"><span class="badge bg-${statusBadge} fs-6">${ens.statut || 'Actif'}</span></p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Informations détaillées -->
                        <div class="col-md-9">
                            <!-- Section Identité -->
                            <div class="card mb-3">
                                <div class="card-header bg-primary text-white">
                                    <h6 class="mb-0"><i class="bi bi-person-badge"></i> Identité</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-hash"></i> ID:</strong> ${ens.id_enseignant || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-card-text"></i> Matricule:</strong> ${ens.matricule_enseignant || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-gender-ambiguous"></i> Sexe:</strong> ${ens.sexe || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-flag"></i> Nationalité:</strong> ${ens.nationalite || 'N/A'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-person"></i> Nom:</strong> ${ens.nom || 'N/A'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-person-lines-fill"></i> Postnom:</strong> ${ens.postnom || 'N/A'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-person-fill"></i> Prénom:</strong> ${ens.prenom || 'N/A'}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-calendar-event"></i> Date Naissance:</strong> ${ens.date_naissance || 'N/A'}
                                        </div>
                                        <div class="col-md-8 mb-2">
                                            <strong><i class="bi bi-geo-alt"></i> Lieu Naissance:</strong> ${ens.lieu_naissance || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <!-- Section Académique -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-success text-white">
                                            <h6 class="mb-0"><i class="bi bi-mortarboard"></i> Informations Académiques</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong><i class="bi bi-award"></i> Grade:</strong> ${ens.grade || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-bookmark-star"></i> Spécialité:</strong> ${ens.specialite || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-file-earmark-text"></i> Diplôme Obtenu:</strong> ${ens.diplome_obtenu || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-calendar3"></i> Année Obtention:</strong> ${ens.annee_obtention_diplome || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-building"></i> Université d'Origine:</strong> ${ens.universite_origine || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Section Coordonnées -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-warning text-dark">
                                            <h6 class="mb-0"><i class="bi bi-telephone"></i> Coordonnées</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong><i class="bi bi-phone"></i> Téléphone:</strong> ${ens.telephone || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-envelope"></i> Email:</strong> ${ens.email || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-house"></i> Adresse:</strong> ${ens.adresse || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Section Bancaire -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-dark text-white">
                                            <h6 class="mb-0"><i class="bi bi-bank"></i> Informations Bancaires</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong><i class="bi bi-credit-card"></i> Numéro Compte:</strong> ${ens.numero_compte || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-bank2"></i> Banque:</strong> ${ens.banque || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <!-- Section Affectation -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0"><i class="bi bi-diagram-3"></i> Affectation</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong><i class="bi bi-building"></i> Faculté:</strong> ${ens.nom_faculte || 'Non affecté'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-layers"></i> Département:</strong> ${ens.departement || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-briefcase"></i> Statut Emploi:</strong> <span class="badge bg-${emploiBadge}">${ens.statut_emploi || 'N/A'}</span>
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-calendar-check"></i> Date Engagement:</strong> ${ens.date_engagement || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Section Administrative -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-secondary text-white">
                                            <h6 class="mb-0"><i class="bi bi-file-earmark-text"></i> Informations Administratives</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong><i class="bi bi-card-list"></i> Numéro d'Ordre:</strong> ${ens.numero_ordre || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-toggle-on"></i> Statut:</strong> <span class="badge bg-${statusBadge}">${ens.statut || 'Actif'}</span>
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-file-pdf"></i> CV:</strong> ${ens.cv_fichier ? `<a href="../uploads/${ens.cv_fichier}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-download"></i> Télécharger</a>` : 'Non disponible'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Section Timestamps -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0"><i class="bi bi-clock-history"></i> Historique</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong><i class="bi bi-calendar-plus"></i> Date Création:</strong> ${ens.date_creation || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-calendar-event"></i> Date Modification:</strong> ${ens.date_modification || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                
                const modal = new bootstrap.Modal(document.getElementById('modalDetailsEnseignant'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement des détails de l\'enseignant');
        }
    });
}

function deleteEnseignant(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
        $.ajax({
            url: '../api/enseignants.php',
            method: 'POST',
            data: { action: 'delete', id_enseignant: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('Enseignant supprimé avec succès');
                    loadEnseignants();
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
