$(document).ready(function() {
    loadCoursPromotions();
    loadFilieres();
    loadCours();
    loadAllPromotionsForModals();
    loadCoursForAttribution();
    loadFilieresForModal();
    
    // Vérifier si on vient d'un transfert depuis cours_modal
    checkTransferMode();
    
    // Recherche en temps réel
    $('#searchCours').on('keyup', function() {
        filterTable();
    });
    
    // Filtres
    $('#filterFiliere').on('change', function() {
        const id_filiere = $(this).val();
        loadPromotionsFilter(id_filiere);
        filterTable();
    });
    
    $('#filterPromotion').on('change', function() {
        filterTable();
    });
    
    // Filtre modal
    $('#modal_filter_filiere').on('change', function() {
        filterPromotionsList();
    });
    
    // Charger promotions selon filière (modal ajout)
    $('#add_id_filiere').on('change', function() {
        const id_filiere = $(this).val();
        loadPromotions(id_filiere, '#add_id_promotion');
    });
    
    // Charger promotions selon filière (modal edit)
    $('#edit_id_filiere').on('change', function() {
        const id_filiere = $(this).val();
        loadPromotions(id_filiere, '#edit_id_promotion');
    });
    
    // Auto-remplir les infos du cours sélectionné (ajout)
    $('#add_id_cours').on('change', function() {
        const selectedOption = $(this).find('option:selected');
        $('#add_code_cours').val(selectedOption.data('code'));
        $('#add_nom_cours').val(selectedOption.data('nom'));
        $('#add_credits').val(selectedOption.data('credits'));
    });
    
    // Auto-remplir les infos du cours sélectionné (edit)
    $('#edit_id_cours').on('change', function() {
        const selectedOption = $(this).find('option:selected');
        $('#edit_code_cours').val(selectedOption.data('code'));
        $('#edit_nom_cours').val(selectedOption.data('nom'));
        $('#edit_credits').val(selectedOption.data('credits'));
    });
    
    // Réinitialiser le modal à la fermeture
    $('#modalAddCoursPromotion').on('hidden.bs.modal', function() {
        $('#step1_cours').show();
        $('#step2_promotions').hide();
        $('#select_id_cours').val('');
    });
});

function filterTable() {
    const searchText = $('#searchCours').val().toLowerCase();
    const filterFiliere = $('#filterFiliere').val();
    const filterPromotion = $('#filterPromotion').val();
    
    $('#tbodyCoursPromotions tr').filter(function() {
        const text = $(this).text().toLowerCase();
        const filiereMatch = !filterFiliere || $(this).data('filiere') == filterFiliere;
        const promotionMatch = !filterPromotion || $(this).data('promotion') == filterPromotion;
        const searchMatch = text.indexOf(searchText) > -1;
        
        $(this).toggle(filiereMatch && promotionMatch && searchMatch);
    });
}

function loadCoursPromotions() {
    $.ajax({
        url: '../api/cours_promotions.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let html = '';
            
            if (!data || data.length === 0) {
                html = `
                    <tr>
                        <td colspan="10" class="text-center py-4">
                            <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                            <p class="mt-2 text-muted">Aucune attribution trouvée</p>
                        </td>
                    </tr>
                `;
            } else {
                data.forEach(function(cp) {
                    const niveauPromotion = cp.niveau || cp.code_promotion || '-';
                    const nomFiliere = cp.nom_filiere || '-';
                    html += `
                        <tr data-filiere="${cp.id_filiere || ''}" data-promotion="${cp.id_promotion || ''}">
                            <td><span class="badge bg-secondary">#${cp.id_cours_promotion}</span></td>
                            <td><strong>${cp.code_cours}</strong></td>
                            <td>${cp.nom_cours}</td>
                            <td><span class="badge bg-info">${cp.credits} CR</span></td>
                            <td><span class="badge bg-primary">${niveauPromotion}</span></td>
                            <td>${nomFiliere}</td>
                            <td><span class="badge bg-success">S${cp.semestre}</span></td>
                            <td>${cp.annee_academique}</td>
                            <td>${cp.enseignant || '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="viewCoursPromotion(${cp.id_cours_promotion})" title="Voir plus">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="transferCours(${cp.id_cours}, '${cp.code_cours}', '${cp.nom_cours}', ${cp.credits})" title="Transférer à d'autres promotions">
                                    <i class="bi bi-arrow-left-right"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="editCoursPromotion(${cp.id_cours_promotion})" title="Modifier">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteCoursPromotion(${cp.id_cours_promotion}, '${cp.nom_cours}')" title="Supprimer">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            $('#tbodyCoursPromotions').html(html);
        },
        error: function() {
            showMessage('Erreur lors du chargement', 'danger');
        }
    });
}

function loadCours() {
    $.ajax({
        url: '../api/cours_promotions.php?action=get_cours',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let html = '<option value="">Sélectionner un cours</option>';
            data.forEach(function(cours) {
                html += `<option value="${cours.id_cours}" data-code="${cours.code_cours}" data-nom="${cours.nom_cours}" data-credits="${cours.credits}">
                    ${cours.code_cours} - ${cours.nom_cours} (${cours.credits} CR)
                </option>`;
            });
            $('#add_id_cours, #edit_id_cours').html(html);
        }
    });
}

function loadFilieres() {
    $.ajax({
        url: '../api/cours_promotions.php?action=get_filieres',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let html = '<option value="">Toutes les filières</option>';
            let htmlModal = '<option value="">Sélectionner une filière</option>';
            data.forEach(function(filiere) {
                html += `<option value="${filiere.id_filiere}">${filiere.nom_filiere}</option>`;
                htmlModal += `<option value="${filiere.id_filiere}">${filiere.nom_filiere}</option>`;
            });
            $('#filterFiliere').html(html);
            $('#add_id_filiere, #edit_id_filiere').html(htmlModal);
            
            // Charger toutes les promotions au démarrage
            loadPromotionsFilter('');
        }
    });
}

function loadPromotionsFilter(id_filiere) {
    const url = id_filiere 
        ? '../api/cours_promotions.php?action=get_promotions&id_filiere=' + id_filiere
        : '../api/cours_promotions.php?action=get_promotions';
    
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let html = '<option value="">Toutes les promotions</option>';
            if (data && data.length > 0) {
                data.forEach(function(promo) {
                    const display = promo.code_promotion || promo.niveau || 'N/A';
                    html += `<option value="${promo.id_promotion}">${display}</option>`;
                });
            }
            $('#filterPromotion').html(html);
        },
        error: function(xhr, status, error) {
            console.error('Erreur chargement promotions filter:', error);
            $('#filterPromotion').html('<option value="">Toutes les promotions</option>');
        }
    });
}

function loadAllPromotionsForModals() {
    $.ajax({
        url: '../api/cours_promotions.php?action=get_promotions',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let html = '<option value="">Sélectionner une promotion</option>';
            if (data && data.length > 0) {
                data.forEach(function(promo) {
                    const display = promo.code_promotion || promo.niveau || 'N/A';
                    html += `<option value="${promo.id_promotion}">${display}</option>`;
                });
            }
            $('#add_id_promotion, #edit_id_promotion').html(html);
        },
        error: function(xhr, status, error) {
            console.error('Erreur chargement toutes les promotions:', error);
            $('#add_id_promotion, #edit_id_promotion').html('<option value="">Erreur de chargement</option>');
        }
    });
}

function loadPromotions(id_filiere, targetSelect) {
    if (!id_filiere) {
        // Si aucune filière n'est sélectionnée, charger toutes les promotions
        loadAllPromotionsForModals();
        return;
    }
    
    $.ajax({
        url: '../api/cours_promotions.php?action=get_promotions&id_filiere=' + id_filiere,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let html = '<option value="">Sélectionner une promotion</option>';
            if (data && data.length > 0) {
                data.forEach(function(promo) {
                    const display = promo.code_promotion || promo.niveau || 'N/A';
                    html += `<option value="${promo.id_promotion}">${display}</option>`;
                });
            } else {
                html += '<option value="">Aucune promotion pour cette filière</option>';
            }
            $(targetSelect).html(html);
        },
        error: function(xhr, status, error) {
            console.error('Erreur chargement promotions:', error);
            $(targetSelect).html('<option value="">Erreur de chargement</option>');
        }
    });
}

function saveCoursPromotion() {
    const formData = $('#formAddCoursPromotion').serialize() + '&action=create';
    
    $.ajax({
        url: '../api/cours_promotions.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showMessage('Attribution créée avec succès', 'success');
                $('#modalAddCoursPromotion').modal('hide');
                $('#formAddCoursPromotion')[0].reset();
                loadCoursPromotions();
            } else {
                showMessage('Erreur: ' + (response.message || 'Impossible de créer'), 'danger');
            }
        },
        error: function() {
            showMessage('Erreur lors de la création', 'danger');
        }
    });
}

function viewCoursPromotion(id) {
    $.ajax({
        url: '../api/cours_promotions.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(cp) {
            $('#modalViewCoursPromotion').data('cpId', cp.id_cours_promotion);
            $('#modalViewCoursPromotion').data('cpNom', cp.nom_cours);
            
            $('#view_code_cours').text(cp.code_cours || '-');
            $('#view_nom_cours').text(cp.nom_cours || '-');
            $('#view_credits').html('<span class="badge bg-info">' + (cp.credits || '0') + ' CR</span>');
            $('#view_semestre').html('<span class="badge bg-success">Semestre ' + cp.semestre + '</span>');
            $('#view_annee_academique').text(cp.annee_academique || '-');
            $('#view_promotion').html('<span class="badge bg-primary">' + (cp.niveau || '-') + '</span>');
            $('#view_filiere').text(cp.nom_filiere || '-');
            $('#view_enseignant').text(cp.enseignant || '-');
            $('#view_volume_horaire').text(cp.volume_horaire ? cp.volume_horaire + 'h' : '-');
            $('#view_salle').text(cp.salle || '-');
            
            var modalView = new bootstrap.Modal(document.getElementById('modalViewCoursPromotion'));
            modalView.show();
        },
        error: function() {
            showMessage('Erreur lors du chargement', 'danger');
        }
    });
}

function editCoursPromotionFromView() {
    const cpId = $('#modalViewCoursPromotion').data('cpId');
    $('#modalViewCoursPromotion').modal('hide');
    setTimeout(() => {
        editCoursPromotion(cpId);
    }, 300);
}

function deleteCoursPromotionFromView() {
    const cpId = $('#modalViewCoursPromotion').data('cpId');
    const cpNom = $('#modalViewCoursPromotion').data('cpNom');
    $('#modalViewCoursPromotion').modal('hide');
    setTimeout(() => {
        deleteCoursPromotion(cpId, cpNom);
    }, 300);
}

function editCoursPromotion(id) {
    $.ajax({
        url: '../api/cours_promotions.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(cp) {
            $('#edit_id_cours_promotion').val(cp.id_cours_promotion);
            $('#edit_id_cours').val(cp.id_cours);
            $('#edit_id_filiere').val(cp.id_filiere);
            
            // Charger les promotions de la filière puis sélectionner
            loadPromotions(cp.id_filiere, '#edit_id_promotion');
            setTimeout(() => {
                $('#edit_id_promotion').val(cp.id_promotion);
            }, 500);
            
            $('#edit_semestre').val(cp.semestre);
            $('#edit_annee_academique').val(cp.annee_academique);
            $('#edit_enseignant').val(cp.enseignant || '');
            $('#edit_volume_horaire').val(cp.volume_horaire || '');
            $('#edit_salle').val(cp.salle || '');
            
            // Infos cours
            $('#edit_code_cours').val(cp.code_cours);
            $('#edit_nom_cours').val(cp.nom_cours);
            $('#edit_credits').val(cp.credits);
            
            var modalEdit = new bootstrap.Modal(document.getElementById('modalEditCoursPromotion'));
            modalEdit.show();
        },
        error: function() {
            showMessage('Erreur lors du chargement', 'danger');
        }
    });
}

function updateCoursPromotion() {
    const formData = $('#formEditCoursPromotion').serialize() + '&action=update';
    
    $.ajax({
        url: '../api/cours_promotions.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showMessage('Attribution modifiée avec succès', 'success');
                $('#modalEditCoursPromotion').modal('hide');
                loadCoursPromotions();
            } else {
                showMessage('Erreur: ' + (response.message || 'Impossible de modifier'), 'danger');
            }
        },
        error: function() {
            showMessage('Erreur lors de la modification', 'danger');
        }
    });
}

function deleteCoursPromotion(id, nom) {
    if (confirm('Voulez-vous vraiment supprimer l\'attribution du cours "' + nom + '" ?')) {
        $.ajax({
            url: '../api/cours_promotions.php?action=delete',
            method: 'POST',
            data: { id_cours_promotion: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showMessage('Attribution supprimée avec succès', 'success');
                    loadCoursPromotions();
                } else {
                    showMessage('Erreur: ' + response.message, 'danger');
                }
            },
            error: function() {
                showMessage('Erreur lors de la suppression', 'danger');
            }
        });
    }
}

function showMessage(message, type) {
    const alertDiv = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" role="alert" style="z-index: 9999;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $('body').append(alertDiv);
    setTimeout(() => {
        $('.alert').alert('close');
    }, 3000);
}

// Nouvelles fonctions pour l'attribution multiple

let selectedCoursData = {};
let allPromotions = [];
let existingAttributions = [];

function loadCoursForAttribution() {
    $.ajax({
        url: '../api/cours_promotions.php?action=get_cours',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let html = '<option value="">Sélectionner un cours</option>';
            data.forEach(function(cours) {
                html += `<option value="${cours.id_cours}" 
                         data-code="${cours.code_cours}" 
                         data-nom="${cours.nom_cours}" 
                         data-credits="${cours.credits}">
                    ${cours.code_cours} - ${cours.nom_cours} (${cours.credits} CR)
                </option>`;
            });
            $('#select_id_cours').html(html);
        }
    });
}

function loadFilieresForModal() {
    $.ajax({
        url: '../api/cours_promotions.php?action=get_filieres',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let html = '<option value="">Toutes les filières</option>';
            data.forEach(function(filiere) {
                html += `<option value="${filiere.id_filiere}">${filiere.nom_filiere}</option>`;
            });
            $('#modal_filter_filiere').html(html);
        }
    });
}

function goToStep2() {
    const id_cours = $('#select_id_cours').val();
    if (!id_cours) {
        showMessage('Veuillez sélectionner un cours', 'warning');
        return;
    }
    
    const selectedOption = $('#select_id_cours option:selected');
    selectedCoursData = {
        id_cours: id_cours,
        code_cours: selectedOption.data('code'),
        nom_cours: selectedOption.data('nom'),
        credits: selectedOption.data('credits')
    };
    
    $('#selected_cours_name').text(`${selectedCoursData.code_cours} - ${selectedCoursData.nom_cours}`);
    $('#selected_cours_credits').text(selectedCoursData.credits);
    
    $('#step1_cours').hide();
    $('#step2_promotions').show();
    
    loadPromotionsList();
}

function goToStep1() {
    $('#step2_promotions').hide();
    $('#step1_cours').show();
}

function loadPromotionsList() {
    Promise.all([
        $.ajax({
            url: '../api/cours_promotions.php?action=get_all_promotions_with_filieres',
            method: 'GET',
            dataType: 'json'
        }),
        $.ajax({
            url: '../api/cours_promotions.php?action=check_existing_attributions&id_cours=' + selectedCoursData.id_cours,
            method: 'GET',
            dataType: 'json'
        })
    ]).then(function([promotions, existing]) {
        allPromotions = promotions;
        existingAttributions = existing;
        renderPromotionsList();
    }).catch(function() {
        showMessage('Erreur lors du chargement des promotions', 'danger');
    });
}

function renderPromotionsList() {
    const filterFiliere = $('#modal_filter_filiere').val();
    let html = '';
    
    const filteredPromotions = filterFiliere 
        ? allPromotions.filter(p => p.id_filiere == filterFiliere)
        : allPromotions;
    
    filteredPromotions.forEach(function(promo) {
        const existing = existingAttributions.find(e => e.id_promotion == promo.id_promotion);
        const isAssigned = !!existing;
        const rowClass = isAssigned ? 'table-success' : '';
        const checkboxDisabled = isAssigned ? 'disabled' : '';
        const checkboxChecked = isAssigned ? 'checked' : '';
        
        html += `
            <tr class="${rowClass}" data-id-promotion="${promo.id_promotion}">
                <td class="text-center">
                    <input type="checkbox" class="form-check-input promo-checkbox" 
                           data-id-promotion="${promo.id_promotion}" 
                           ${checkboxChecked} ${checkboxDisabled}>
                </td>
                <td><strong>${promo.code_promotion}</strong></td>
                <td><span class="badge bg-primary">${promo.niveau}</span></td>
                <td>${promo.nom_filiere || '-'}</td>
                <td>
                    <select class="form-select form-select-sm semestre-select" 
                            data-id-promotion="${promo.id_promotion}" 
                            ${checkboxDisabled}>
                        <option value="1" ${existing && existing.semestre == '1' ? 'selected' : ''}>S1</option>
                        <option value="2" ${existing && existing.semestre == '2' ? 'selected' : ''}>S2</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm annee-input" 
                           data-id-promotion="${promo.id_promotion}" 
                           value="${existing ? existing.annee_academique : '2024-2025'}"
                           placeholder="2024-2025" ${checkboxDisabled}>
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm enseignant-input" 
                           data-id-promotion="${promo.id_promotion}" 
                           value="${existing ? (existing.enseignant || '') : ''}"
                           placeholder="Nom enseignant" ${checkboxDisabled}>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm volhoraire-input" 
                           data-id-promotion="${promo.id_promotion}" 
                           value="${existing ? (existing.volume_horaire || '') : ''}"
                           placeholder="h" ${checkboxDisabled}>
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm salle-input" 
                           data-id-promotion="${promo.id_promotion}" 
                           value="${existing ? (existing.salle || '') : ''}"
                           placeholder="Salle" ${checkboxDisabled}>
                </td>
                <td class="text-center">
                    ${isAssigned 
                        ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Attribué</span>' 
                        : '<span class="badge bg-secondary">Non attribué</span>'}
                </td>
            </tr>
        `;
    });
    
    $('#tbody_promotions_list').html(html || '<tr><td colspan="10" class="text-center text-muted">Aucune promotion disponible</td></tr>');
}

function filterPromotionsList() {
    renderPromotionsList();
}

function saveMultipleAttributions() {
    console.log('1. Fonction appelée');
    console.log('2. selectedCoursData:', selectedCoursData);
    
    // Vérifier selectedCoursData
    if (!selectedCoursData || !selectedCoursData.id_cours) {
        console.error('selectedCoursData invalide!');
        alert('Erreur: Aucun cours sélectionné');
        return;
    }
    
    console.log('3. Cours valide, recherche des checkboxes...');
    
    const attributions = [];
    const checkboxes = $('.promo-checkbox:checked:not(:disabled)');
    console.log('4. Nombre de checkboxes cochées:', checkboxes.length);
    
    if (checkboxes.length === 0) {
        alert('Veuillez cocher au moins une promotion');
        return;
    }
    
    let validationError = false;
    
    // Parcourir les checkboxes cochées
    checkboxes.each(function(index) {
        console.log(`5.${index} - Traitement checkbox ${index + 1}`);
        const row = $(this).closest('tr');
        const id_promotion = $(this).data('id-promotion');
        const semestre = row.find('.semestre-select').val();
        const annee_academique = row.find('.annee-input').val();
        
        console.log(`   ID promotion: ${id_promotion}, Semestre: ${semestre}, Année: ${annee_academique}`);
        
        if (!semestre || !annee_academique) {
            alert('Remplissez le semestre et l\'année académique pour toutes les promotions cochées');
            validationError = true;
            return false; // Stop each()
        }
        
        attributions.push({
            id_cours: parseInt(selectedCoursData.id_cours),
            code_cours: selectedCoursData.code_cours,
            nom_cours: selectedCoursData.nom_cours,
            credits: parseInt(selectedCoursData.credits),
            id_promotion: parseInt(id_promotion),
            semestre: semestre.toString(),
            annee_academique: annee_academique.toString(),
            enseignant: row.find('.enseignant-input').val() || null,
            volume_horaire: row.find('.volhoraire-input').val() || null,
            salle: row.find('.salle-input').val() || null
        });
    });
    
    if (validationError) {
        console.log('6. Erreur de validation');
        return;
    }
    
    console.log('7. Attributions préparées:', attributions);
    console.log('8. Envoi AJAX...');
    
    // Envoi AJAX
    $.ajax({
        url: '../api/cours_promotions.php?action=create_multiple',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(attributions),
        dataType: 'json',
        success: function(response) {
            console.log('9. Réponse reçue:', response);
            if (response.success || response.success_count > 0) {
                alert('✅ ' + response.success_count + ' attribution(s) enregistrée(s)');
                $('#modalAddCoursPromotion').modal('hide');
                console.log('10. Rechargement du tableau...');
                loadCoursPromotions();
            } else {
                console.error('Échec:', response);
                alert('Erreur: ' + (response.message || 'Échec enregistrement'));
            }
        },
        error: function(xhr, status, error) {
            console.error('11. Erreur AJAX:', {xhr, status, error});
            console.error('Response:', xhr.responseText);
            alert('Erreur serveur: ' + (xhr.responseText || error));
        }
    });
}

function transferCours(id_cours, code_cours, nom_cours, credits) {
    // Préparer les données du cours
    selectedCoursData = {
        id_cours: id_cours,
        code_cours: code_cours,
        nom_cours: nom_cours,
        credits: credits
    };
    
    // Pré-sélectionner le cours dans le dropdown
    $('#select_id_cours').val(id_cours);
    
    // Mettre à jour l'affichage
    $('#selected_cours_name').text(`${code_cours} - ${nom_cours}`);
    $('#selected_cours_credits').text(credits);
    
    // Ouvrir le modal directement à l'étape 2
    $('#step1_cours').hide();
    $('#step2_promotions').show();
    
    // Charger la liste des promotions
    loadPromotionsList();
    
    // Ouvrir le modal
    var modalAdd = new bootstrap.Modal(document.getElementById('modalAddCoursPromotion'));
    modalAdd.show();
}

function checkTransferMode() {
    // Vérifier s'il y a un paramètre transfer dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const isTransfer = urlParams.get('transfer');
    
    if (isTransfer === '1') {
        // Récupérer les données du cours depuis sessionStorage
        const transferData = sessionStorage.getItem('transfer_cours');
        
        if (transferData) {
            const coursData = JSON.parse(transferData);
            console.log('Mode transfert activé pour:', coursData);
            
            // Attendre que la page soit complètement chargée
            setTimeout(function() {
                transferCours(
                    coursData.id_cours, 
                    coursData.code_cours, 
                    coursData.nom_cours, 
                    coursData.credits
                );
                
                // Nettoyer le sessionStorage
                sessionStorage.removeItem('transfer_cours');
                
                // Nettoyer l'URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 500);
        }
    }
}

