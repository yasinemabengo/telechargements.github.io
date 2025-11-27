$(document).ready(function() {
    loadAgents();
    
    // Animation des form-group
    $('.form-group').each(function(index) {
        $(this).css('animation-delay', (index * 0.05) + 's');
    });
    
    // Changement du nombre d'éléments par page
    $('#itemsPerPage').on('change', function() {
        currentPage = 1;
        displayAgents();
    });
});

let allAgents = [];
let filteredAgents = [];
let currentPage = 1;

function loadAgents() {
    $.ajax({
        url: '../api/agents.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            console.log('Données reçues:', data); // Debug
            
            if (data && data.error) {
                console.error('Erreur API:', data.error);
                alert('Erreur: ' + data.error);
                allAgents = [];
            } else {
                allAgents = data || [];
            }
            
            filteredAgents = allAgents;
            $('#totalAgents').text(allAgents.length + ' agent' + (allAgents.length > 1 ? 's' : ''));
            currentPage = 1;
            displayAgents();
        },
        error: function(xhr, status, error) {
            console.error('Erreur AJAX:', error);
            console.error('Réponse:', xhr.responseText);
            $('#tbodyAgents').html(`
                <tr>
                    <td colspan="16" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle"></i> Erreur lors du chargement: ${error}
                    </td>
                </tr>
            `);
            $('#totalAgents').text('0 agents');
        }
    });
}

function displayAgents() {
    const tbody = $('#tbodyAgents');
    tbody.empty();
    
    if (!filteredAgents || filteredAgents.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="17" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> Aucun agent trouvé
                </td>
            </tr>
        `);
        $('#showingInfo').text('Affichage de 0 à 0 sur 0 entrées');
        $('#pagination').empty();
        return;
    }
    
    const itemsPerPage = $('#itemsPerPage').val();
    const totalItems = filteredAgents.length;
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
        const agent = filteredAgents[i];
        const statusBadge = agent.statut === 'Actif' ? 'bg-success' : 
                           agent.statut === 'Suspendu' ? 'bg-warning' : 
                           agent.statut === 'Retraité' ? 'bg-info' : 'bg-secondary';
        
        tbody.append(`
            <tr>
                <td style="position: sticky; left: 0; background-color: #fff; z-index: 1;">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-info" onclick="viewAgent(${agent.id_agent})" title="Voir plus">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-success" onclick="window.open('../card/card_agent.php?id=${agent.id_agent}', '_blank')" title="Générer carte">
                            <i class="bi bi-credit-card"></i>
                        </button>
                        <button class="btn btn-warning" onclick="editAgent(${agent.id_agent})" title="Modifier">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteAgent(${agent.id_agent})" title="Supprimer">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
                <td><strong>${agent.id_agent || ''}</strong></td>
                <td>${agent.nom || 'N/A'}</td>
                <td>${agent.postnom || 'N/A'}</td>
                <td>${agent.prenom || 'N/A'}</td>
                <td><span class="badge ${agent.sexe === 'Masculin' ? 'bg-primary' : 'bg-danger'}">${agent.sexe || 'N/A'}</span></td>
                <td>${agent.etat_civil || 'N/A'}</td>
                <td>${agent.telephone || 'N/A'}</td>
                <td>${agent.adresses || 'N/A'}</td>
                <td>${agent.date_de_naissance || 'N/A'}</td>
                <td>${agent.lieu_de_naissance || 'N/A'}</td>
                <td><strong>${agent.fonction || 'N/A'}</strong></td>
                <td>${agent.grade || 'N/A'}</td>
                <td>${agent.niveau_etude || 'N/A'}</td>
                <td>${agent.date_engangement || 'N/A'}</td>
                <td>${agent.salaire || 'N/A'}</td>
                <td><span class="badge ${statusBadge}">${agent.statut || 'Actif'}</span></td>
            </tr>
        `);
    }
    
    $('#showingInfo').text(`Affichage de ${startIndex + 1} à ${endIndex} sur ${totalItems} entrées`);
    
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
    
    pagination.append(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `);
    
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
    displayAgents();
    $('html, body').animate({
        scrollTop: $('#tableAgents').offset().top - 100
    }, 300);
}

$('#formAddAgent').on('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const action = $('#id_agent').val() ? 'update' : 'create';
    formData.set('action', action);
    
    $.ajax({
        url: '../api/agents.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert(action === 'create' ? 'Agent ajouté avec succès' : 'Agent modifié avec succès');
                resetForm();
                loadAgents();
            } else {
                alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erreur:', error, xhr.responseText);
            alert('Erreur lors de l\'enregistrement: ' + error);
        }
    });
});

function editAgent(id) {
    $.ajax({
        url: '../api/agents.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(agent) {
            if (agent) {
                $('#id_agent').val(agent.id_agent);
                $('#nom').val(agent.nom);
                $('#postnom').val(agent.postnom);
                $('#prenom').val(agent.prenom);
                $('#sexe').val(agent.sexe);
                $('#etat_civil').val(agent.etat_civil);
                $('#date_de_naissance').val(agent.date_de_naissance);
                $('#lieu_de_naissance').val(agent.lieu_de_naissance);
                $('#telephone').val(agent.telephone);
                $('#adresses').val(agent.adresses);
                $('#fonction').val(agent.fonction);
                $('#grade').val(agent.grade);
                $('#niveau_etude').val(agent.niveau_etude);
                $('#date_engangement').val(agent.date_engangement);
                $('#salaire').val(agent.salaire);
                $('#statut').val(agent.statut);
                
                $('button[type="submit"]').html('<i class="bi bi-check-circle"></i> Modifier');
                
                $('html, body').animate({
                    scrollTop: $('#formAddAgent').offset().top - 100
                }, 500);
            }
        },
        error: function() {
            alert('Erreur lors du chargement de l\'agent');
        }
    });
}

function deleteAgent(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
        $.ajax({
            url: '../api/agents.php',
            method: 'POST',
            data: { action: 'delete', id_agent: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('Agent supprimé avec succès');
                    loadAgents();
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
    $('#formAddAgent')[0].reset();
    $('#id_agent').val('');
    $('#action').val('create');
    $('#photoPreview').hide();
    $('button[type="submit"]').html('<i class="bi bi-check-circle"></i> Enregistrer');
}

// Recherche dans le tableau
$('#searchAgents').on('keyup', function() {
    const value = $(this).val().toLowerCase();
    
    if (value === '') {
        filteredAgents = allAgents;
    } else {
        filteredAgents = allAgents.filter(function(agent) {
            return JSON.stringify(agent).toLowerCase().includes(value);
        });
    }
    
    currentPage = 1;
    displayAgents();
});

function viewAgent(id) {
    $.ajax({
        url: '../api/agents.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(agent) {
            if (agent) {
                const modalBody = $('#modalBodyDetails');
                const fullName = `${agent.prenom || ''} ${agent.nom || ''} ${agent.postnom || ''}`.trim();
                
                const statusBadge = agent.statut === 'Actif' ? 'success' : 
                                   agent.statut === 'Suspendu' ? 'warning' : 
                                   agent.statut === 'Retraité' ? 'info' : 'secondary';
                
                // Préparer l'affichage de la photo
                let photoHtml = '';
                if (agent.photo_base64) {
                    photoHtml = `<img src="data:image/jpeg;base64,${agent.photo_base64}" class="img-fluid rounded mb-3" style="max-height: 250px; object-fit: cover;" alt="Photo">`;
                } else {
                    photoHtml = '<div class="bg-secondary text-white rounded d-flex align-items-center justify-content-center mb-3" style="height: 250px; font-size: 80px;"><i class="bi bi-person-circle"></i></div>';
                }
                
                // Préparer l'affichage du CV
                let cvHtml = 'Non disponible';
                if (agent.cv_base64) {
                    cvHtml = `
                        <a href="../api/agents.php?action=get_cv&id=${agent.id_agent}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-file-pdf"></i> Ouvrir CV
                        </a>
                        <a href="../api/agents.php?action=get_cv&id=${agent.id_agent}" download="cv_agent_${agent.id_agent}.pdf" class="btn btn-sm btn-outline-success">
                            <i class="bi bi-download"></i> Télécharger
                        </a>
                    `;
                }
                
                // Préparer l'affichage du dossier
                let dossierHtml = 'Non disponible';
                if (agent.dossier_base64) {
                    dossierHtml = `
                        <a href="../api/agents.php?action=get_dossier&id=${agent.id_agent}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-folder"></i> Ouvrir Dossier
                        </a>
                        <a href="../api/agents.php?action=get_dossier&id=${agent.id_agent}" download="dossier_agent_${agent.id_agent}.pdf" class="btn btn-sm btn-outline-success">
                            <i class="bi bi-download"></i> Télécharger
                        </a>
                    `;
                }
                
                modalBody.html(`
                    <div class="row">
                        <!-- Photo et informations principales -->
                        <div class="col-md-3 text-center mb-4">
                            <div class="card">
                                <div class="card-body">
                                    ${photoHtml}
                                    <h4 class="mb-2">${fullName}</h4>
                                    <p class="text-muted mb-2 fs-5">${agent.fonction || 'N/A'}</p>
                                    <p class="mb-2"><span class="badge bg-primary fs-6">${agent.grade || 'N/A'}</span></p>
                                    <p class="mb-0"><span class="badge bg-${statusBadge} fs-6">${agent.statut || 'Actif'}</span></p>
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
                                            <strong><i class="bi bi-hash"></i> ID:</strong> ${agent.id_agent || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-gender-ambiguous"></i> Sexe:</strong> ${agent.sexe || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-heart"></i> État Civil:</strong> ${agent.etat_civil || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-calendar-event"></i> Date Naissance:</strong> ${agent.date_de_naissance || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-geo-alt"></i> Lieu:</strong> ${agent.lieu_de_naissance || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-person"></i> Nom:</strong> ${agent.nom || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-person-lines-fill"></i> Postnom:</strong> ${agent.postnom || 'N/A'}
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <strong><i class="bi bi-person-fill"></i> Prénom:</strong> ${agent.prenom || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <!-- Section Professionnelle -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-success text-white">
                                            <h6 class="mb-0"><i class="bi bi-briefcase"></i> Informations Professionnelles</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong><i class="bi bi-award"></i> Fonction:</strong> ${agent.fonction || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-star"></i> Grade:</strong> ${agent.grade || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-mortarboard"></i> Niveau Étude:</strong> ${agent.niveau_etude || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-calendar-check"></i> Date Engagement:</strong> ${agent.date_engangement || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-cash"></i> Salaire:</strong> ${agent.salaire || 'N/A'}
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
                                                <strong><i class="bi bi-phone"></i> Téléphone:</strong> ${agent.telephone || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-house"></i> Adresse:</strong> ${agent.adresses || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <!-- Section Documents -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0"><i class="bi bi-file-earmark-text"></i> Documents</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-3">
                                                <strong><i class="bi bi-file-pdf"></i> CV:</strong><br>
                                                ${cvHtml}
                                            </div>
                                            <div class="mb-2">
                                                <strong><i class="bi bi-folder"></i> Dossier:</strong><br>
                                                ${dossierHtml}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Section Statut -->
                                    <div class="card mb-3">
                                        <div class="card-header bg-secondary text-white">
                                            <h6 class="mb-0"><i class="bi bi-toggle-on"></i> Statut</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong><i class="bi bi-check-circle"></i> Statut:</strong> <span class="badge bg-${statusBadge}">${agent.statut || 'Actif'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                
                const modal = new bootstrap.Modal(document.getElementById('modalDetailsAgent'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement des détails de l\'agent');
        }
    });
}
