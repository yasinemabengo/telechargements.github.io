$(document).ready(function() {
    loadInscriptions();
    loadFilieresForChoix();
    
    // Aperçu de la photo
    $('#photo').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('La photo ne doit pas dépasser 2MB');
                $(this).val('');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#photoPreviewImg').attr('src', e.target.result);
                $('#photoPreview').show();
            };
            reader.readAsDataURL(file);
        } else {
            $('#photoPreview').hide();
        }
    });
    
    // Aperçu du PDF
    $('#dossiers').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le dossier PDF ne doit pas dépasser 5MB');
                $(this).val('');
                return;
            }
            $('#dossiersFileName').text(file.name);
            $('#dossiersPreview').show();
        } else {
            $('#dossiersPreview').hide();
        }
    });
    
    // Soumission du formulaire
    $('#formAddInscription').on('submit', function(e) {
        e.preventDefault();
        
        const action = $('#formAction').val();
        const isUpdate = action === 'update';
        
        // Utiliser FormData pour gérer les fichiers
        const formData = new FormData(this);
        
        $.ajax({
            url: '../api/inscriptions.php',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert(isUpdate ? 'Inscription modifiée avec succès!' : 'Inscription enregistrée avec succès!');
                    $('#formAddInscription')[0].reset();
                    $('#photoPreview').hide();
                    $('#dossiersPreview').hide();
                    resetFormToCreate();
                    loadInscriptions();
                } else {
                    alert('Erreur: ' + response.message);
                }
            },
            error: function() {
                alert('Erreur lors de l\'enregistrement');
            }
        });
    });
    
    // Annuler la modification
    $('#btnCancelEdit').on('click', function() {
        resetFormToCreate();
    });
    
    // Réinitialiser au mode création
    $('#btnReset').on('click', function() {
        setTimeout(resetFormToCreate, 100);
    });
    
    // Actions depuis la modal
    $('#btnEditFromModal').on('click', function() {
        if (currentInscriptionId) {
            $('#modalDetailsInscription').modal('hide');
            editInscription(currentInscriptionId);
        }
    });

    $('#btnDeleteFromModal').on('click', function() {
        if (currentInscriptionId) {
            $('#modalDetailsInscription').modal('hide');
            deleteInscription(currentInscriptionId);
        }
    });
    
    // Recherche dans le tableau
    $('#searchInscriptions').on('keyup', function() {
        const value = $(this).val().toLowerCase();
        $('#tbodyInscriptions tr').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
});

let currentInscriptionId = null;

function loadFilieresForChoix() {
    $.ajax({
        url: '../api/filieres.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data && Array.isArray(data)) {
                const select1 = $('#premier_choix');
                const select2 = $('#deuxieme_choix');
                
                data.forEach(function(fil) {
                    select1.append(`<option value="${fil.nom_filiere}">${fil.nom_filiere}</option>`);
                    select2.append(`<option value="${fil.nom_filiere}">${fil.nom_filiere}</option>`);
                });
            }
        }
    });
}

function loadInscriptions() {
    $.ajax({
        url: '../api/inscriptions.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const tbody = $('#tbodyInscriptions');
            tbody.empty();
            
            // Mettre à jour le compteur
            $('#totalInscriptions').text(data ? data.length : 0);
            
            // Calculer les statistiques
            if (data && data.length > 0) {
                let statValidee = 0, statEnAttente = 0, statRejetee = 0;
                let statMasculin = 0, statFeminin = 0;
                let annees = {};
                let choix = {};
                
                data.forEach(function(insc) {
                    // Statut
                    if (insc.statut_inscription === 'Validée') statValidee++;
                    else if (insc.statut_inscription === 'En attente') statEnAttente++;
                    else if (insc.statut_inscription === 'Rejetée' || insc.statut_inscription === 'Annulée') statRejetee++;
                    
                    // Sexe
                    if (insc.sexe === 'M') statMasculin++;
                    else if (insc.sexe === 'F') statFeminin++;
                    
                    // Année académique
                    if (insc.annee_academique) {
                        annees[insc.annee_academique] = (annees[insc.annee_academique] || 0) + 1;
                    }
                    
                    // Choix de formation
                    if (insc.premier_choix) {
                        choix[insc.premier_choix] = (choix[insc.premier_choix] || 0) + 1;
                    }
                    if (insc.deuxieme_choix) {
                        choix[insc.deuxieme_choix] = (choix[insc.deuxieme_choix] || 0) + 1;
                    }
                });
                
                // Afficher les stats
                $('#statValidee').text(statValidee);
                $('#statEnAttente').text(statEnAttente);
                $('#statRejetee').text(statRejetee);
                $('#statMasculin').text(statMasculin);
                $('#statFeminin').text(statFeminin);
                
                // Années
                let anneesHTML = '';
                Object.keys(annees).sort().forEach(function(annee) {
                    anneesHTML += `<span class="badge bg-secondary me-1 mb-1">${annee}: ${annees[annee]}</span>`;
                });
                $('#statAnnees').html(anneesHTML || '<span class="text-muted">Aucune</span>');
                
                // Top 3 choix
                let choixSorted = Object.entries(choix).sort((a, b) => b[1] - a[1]).slice(0, 3);
                let choixHTML = '';
                choixSorted.forEach(function([filiere, count]) {
                    choixHTML += `<div class="mb-1"><span class="badge bg-warning text-dark">${count}</span> ${filiere}</div>`;
                });
                $('#statChoix').html(choixHTML || '<span class="text-muted">Aucun</span>');
            } else {
                $('#statValidee').text(0);
                $('#statEnAttente').text(0);
                $('#statRejetee').text(0);
                $('#statMasculin').text(0);
                $('#statFeminin').text(0);
                $('#statAnnees').html('<span class="text-muted">Aucune</span>');
                $('#statChoix').html('<span class="text-muted">Aucun</span>');
            }
            
            if (!data || data.length === 0) {
                tbody.append('<tr><td colspan="7" class="text-center">Aucune inscription trouvée</td></tr>');
                return;
            }
            
            data.forEach(function(insc) {
                const fullName = `${insc.prenom || ''} ${insc.nom || ''} ${insc.postnom || ''}`.trim();
                let statusBadge = 'bg-warning';
                if (insc.statut_inscription === 'Validée') statusBadge = 'bg-success';
                if (insc.statut_inscription === 'Rejetée' || insc.statut_inscription === 'Annulée') statusBadge = 'bg-danger';
                
                const isTransfered = insc.transfere_etudiant == 1;
                const transferBtn = isTransfered ? 
                    '<button class="btn btn-sm btn-secondary" disabled title="Déjà ajouté comme étudiant"><i class="bi bi-check-circle"></i></button>' :
                    `<button class="btn btn-sm btn-success" onclick="transferToEtudiant(${insc.id_inscription})" title="Enregistrer comme étudiant"><i class="bi bi-person-plus"></i></button>`;
                
                const transferBadge = isTransfered ? '<span class="badge bg-success ms-1">Étudiant</span>' : '';
                
                tbody.append(`
                    <tr>
                        <td>${insc.id_inscription}</td>
                        <td>${fullName}${transferBadge}</td>
                        <td>${insc.telephone || 'N/A'}</td>
                        <td>${insc.premier_choix || 'N/A'}</td>
                        <td>${insc.date_inscription || 'N/A'}</td>
                        <td><span class="badge ${statusBadge}">${insc.statut_inscription || 'N/A'}</span></td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-info" onclick="viewInscription(${insc.id_inscription})" title="Voir plus">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="editInscription(${insc.id_inscription})" title="Modifier">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                ${transferBtn}
                                <button class="btn btn-sm btn-danger" onclick="deleteInscription(${insc.id_inscription})" title="Supprimer">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `);
            });
        },
        error: function() {
            $('#tbodyInscriptions').html('<tr><td colspan="7" class="text-center text-danger">Erreur lors du chargement</td></tr>');
        }
    });
}

function viewInscription(id) {
    currentInscriptionId = id;
    $.ajax({
        url: '../api/inscriptions.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(insc) {
            if (insc) {
                const statusColor = insc.statut_inscription === 'Validée' ? 'success' : 
                                   insc.statut_inscription === 'En attente' ? 'warning' : 'danger';
                
                const modalBody = $('#modalBodyDetailsInscription');
                modalBody.html(`
                    <div class="row">
                        <div class="col-12">
                            <!-- Informations Personnelles -->
                            <div class="card mb-3">
                                <div class="card-header bg-primary text-white">
                                    <h6 class="mb-0"><i class="bi bi-person-badge"></i> Informations Personnelles</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4 mb-2"><strong>Nom:</strong> ${insc.nom}</div>
                                        <div class="col-md-4 mb-2"><strong>Postnom:</strong> ${insc.postnom}</div>
                                        <div class="col-md-4 mb-2"><strong>Prénom:</strong> ${insc.prenom}</div>
                                        <div class="col-md-4 mb-2"><strong>Sexe:</strong> ${insc.sexe === 'M' ? 'Masculin' : 'Féminin'}</div>
                                        <div class="col-md-4 mb-2"><strong>Date de Naissance:</strong> ${insc.date_naissance}</div>
                                        <div class="col-md-4 mb-2"><strong>Lieu de Naissance:</strong> ${insc.lieu_naissance}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Coordonnées -->
                            <div class="card mb-3">
                                <div class="card-header bg-info text-white">
                                    <h6 class="mb-0"><i class="bi bi-telephone"></i> Coordonnées</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4 mb-2"><strong>Téléphone:</strong> ${insc.telephone}</div>
                                        <div class="col-md-4 mb-2"><strong>Email:</strong> ${insc.email || 'N/A'}</div>
                                        <div class="col-md-4 mb-2"><strong>Adresse:</strong> ${insc.adresse}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Parcours Académique -->
                            <div class="card mb-3">
                                <div class="card-header bg-success text-white">
                                    <h6 class="mb-0"><i class="bi bi-mortarboard"></i> Parcours Académique</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-2"><strong>Année d'Obtention:</strong> ${insc.annee_obtention_diplome}</div>
                                        <div class="col-md-6 mb-2"><strong>Pourcentage:</strong> ${insc.pourcentage_obtenu}%</div>
                                        <div class="col-md-6 mb-2"><strong>École:</strong> ${insc.nom_ecole}</div>
                                        <div class="col-md-6 mb-2"><strong>Province:</strong> ${insc.province_ecole}</div>
                                        <div class="col-md-12 mb-2"><strong>Adresse École:</strong> ${insc.adresse_ecole}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Choix de Formation -->
                            <div class="card mb-3">
                                <div class="card-header bg-warning text-dark">
                                    <h6 class="mb-0"><i class="bi bi-bookmark-star"></i> Choix de Formation</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4 mb-2"><strong>Premier Choix:</strong> ${insc.premier_choix}</div>
                                        <div class="col-md-4 mb-2"><strong>Deuxième Choix:</strong> ${insc.deuxieme_choix || 'N/A'}</div>
                                        <div class="col-md-4 mb-2"><strong>Année Académique:</strong> ${insc.annee_academique}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Informations Administratives -->
                            <div class="card mb-3">
                                <div class="card-header bg-dark text-white">
                                    <h6 class="mb-0"><i class="bi bi-file-earmark-text"></i> Informations Administratives</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4 mb-2"><strong>Date d'Inscription:</strong> ${insc.date_inscription}</div>
                                        <div class="col-md-4 mb-2"><strong>N° Reçu:</strong> ${insc.numero_recu || 'N/A'}</div>
                                        <div class="col-md-4 mb-2"><strong>Montant:</strong> ${insc.montant_inscription || 0} FC</div>
                                        <div class="col-md-12 mb-2"><strong>Statut:</strong> <span class="badge bg-${statusColor}">${insc.statut_inscription}</span></div>
                                        <div class="col-md-12 mb-2"><strong>Observations:</strong> ${insc.observations || 'Aucune'}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Documents -->
                            <div class="card">
                                <div class="card-header bg-secondary text-white">
                                    <h6 class="mb-0"><i class="bi bi-file-earmark-arrow-up"></i> Documents</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 text-center">
                                            <strong>Photo:</strong><br>
                                            ${insc.photo ? `<img src="../uploads/inscriptions/${insc.photo}" alt="Photo" class="img-thumbnail mt-2" style="max-width: 200px; max-height: 200px;">` : '<span class="text-muted">Aucune photo</span>'}
                                        </div>
                                        <div class="col-md-6 text-center">
                                            <strong>Dossier PDF:</strong><br>
                                            ${insc.dossiers ? `<a href="../uploads/inscriptions/${insc.dossiers}" target="_blank" class="btn btn-outline-danger mt-2"><i class="bi bi-file-pdf"></i> Ouvrir le PDF</a>` : '<span class="text-muted">Aucun dossier</span>'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                
                const modal = new bootstrap.Modal(document.getElementById('modalDetailsInscription'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement des détails');
        }
    });
}

function editInscription(id) {
    $.ajax({
        url: '../api/inscriptions.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data) {
                const insc = response.data;
                // Changer le mode du formulaire en modification
                $('#formAction').val('update');
                $('#id_inscription').val(insc.id_inscription);
                $('#formTitle').html('Modifier l\'Inscription #' + insc.id_inscription);
                $('#formCardHeader i').attr('class', 'bi bi-pencil');
                $('#btnSubmitText').text('Enregistrer les modifications');
                $('#btnSubmit').removeClass('btn-success').addClass('btn-primary');
                $('#btnCancelEdit').show();
                
                // Remplir tous les champs
                $('#nom').val(insc.nom);
                $('#postnom').val(insc.postnom);
                $('#prenom').val(insc.prenom);
                $('#sexe').val(insc.sexe);
                $('#date_naissance').val(insc.date_naissance);
                $('#lieu_naissance').val(insc.lieu_naissance);
                $('#telephone').val(insc.telephone);
                $('#email').val(insc.email);
                $('#adresse').val(insc.adresse);
                $('#annee_obtention_diplome').val(insc.annee_obtention_diplome);
                $('#pourcentage_obtenu').val(insc.pourcentage_obtenu);
                $('#nom_ecole').val(insc.nom_ecole);
                $('#adresse_ecole').val(insc.adresse_ecole);
                $('#province_ecole').val(insc.province_ecole);
                $('#premier_choix').val(insc.premier_choix);
                $('#deuxieme_choix').val(insc.deuxieme_choix);
                $('#annee_academique').val(insc.annee_academique);
                $('#date_inscription').val(insc.date_inscription);
                $('#numero_recu').val(insc.numero_recu);
                $('#montant_inscription').val(insc.montant_inscription);
                $('#statut_inscription').val(insc.statut_inscription);
                $('#observations').val(insc.observations);
                
                // Scroller vers le formulaire
                $('html, body').animate({
                    scrollTop: $('#formAddInscription').offset().top - 100
                }, 500);
            } else {
                alert('Inscription non trouvée');
            }
        },
        error: function() {
            alert('Erreur lors du chargement des données');
        }
    });
}

function resetFormToCreate() {
    $('#formAction').val('create');
    $('#id_inscription').val('');
    $('#formTitle').html('Nouvelle Demande d\'Inscription');
    $('#formCardHeader i').attr('class', 'bi bi-plus-circle');
    $('#btnSubmitText').text('Enregistrer l\'Inscription');
    $('#btnSubmit').removeClass('btn-primary').addClass('btn-success');
    $('#btnCancelEdit').hide();
}

function deleteInscription(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
        $.ajax({
            url: '../api/inscriptions.php',
            method: 'POST',
            data: { action: 'delete', id_inscription: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('Inscription supprimée avec succès');
                    loadInscriptions();
                } else {
                    alert('Erreur: ' + response.message);
                }
            },
            error: function() {
                alert('Erreur lors de la suppression');
            }
        });
    }
}

function transferToEtudiant(id) {
    if (confirm('Voulez-vous transférer cette inscription vers le formulaire étudiant ?')) {
        // Sauvegarder l'ID dans sessionStorage pour le récupérer dans ajout_etudiant.php
        sessionStorage.setItem('inscriptionToTransfer', id);
        // Rediriger vers le formulaire d'ajout d'étudiant
        window.location.href = 'ajout_etudiant.php?from_inscription=' + id;
    }
}
