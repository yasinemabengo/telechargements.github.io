$(document).ready(function() {
    loadPromotions();
    loadFilieresInModals();
});

function loadFilieresInModals() {
    $.ajax({
        url: '../api/filieres.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const selectAdd = $('#select_filiere_add');
            const selectEdit = $('#edit_id_filiere_promo');
            
            selectAdd.empty();
            selectEdit.empty();
            
            selectAdd.append('<option value="">Sélectionner une filière</option>');
            selectEdit.append('<option value="">Sélectionner une filière</option>');
            
            if (data && data.length > 0) {
                data.forEach(function(fil) {
                    selectAdd.append(`<option value="${fil.id_filiere}">${fil.nom_filiere}</option>`);
                    selectEdit.append(`<option value="${fil.id_filiere}">${fil.nom_filiere}</option>`);
                });
            }
        }
    });
}

function loadPromotions() {
    $.ajax({
        url: '../api/promotions.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const tbody = $('#tbodyPromotions');
            tbody.empty();
            
            if (!data || data.length === 0) {
                tbody.append(`
                    <tr>
                        <td colspan="7" class="text-center text-muted">
                            <i class="bi bi-inbox"></i> Aucune promotion enregistrée
                        </td>
                    </tr>
                `);
                return;
            }
            
            data.forEach(function(promo) {
                tbody.append(`
                    <tr>
                        <td>
                            <div class="btn-group btn-group-sm" role="group">
                                <button class="btn btn-info" onclick="viewPromotion(${promo.id_promotion})" title="Voir plus">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-warning" onclick="editPromotion(${promo.id_promotion})" title="Modifier">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-danger" onclick="deletePromotion(${promo.id_promotion})" title="Supprimer">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                        <td><strong>${promo.id_promotion}</strong></td>
                        <td><span class="badge bg-primary">${promo.code_promotion}</span></td>
                        <td>${promo.nom_filiere || 'N/A'}</td>
                        <td><span class="badge bg-info">${promo.niveau}</span></td>
                        <td>${promo.annee_academique}</td>
                        <td><span class="badge bg-success">${promo.effectif_max}</span></td>
                    </tr>
                `);
            });
        },
        error: function(xhr, status, error) {
            console.error('Erreur:', error);
            $('#tbodyPromotions').html(`
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle"></i> Erreur lors du chargement
                    </td>
                </tr>
            `);
        }
    });
}

function viewPromotion(id) {
    $.ajax({
        url: '../api/promotions.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(promo) {
            if (promo) {
                const modalBody = $('#modalBodyDetailsPromotion');
                
                modalBody.html(`
                    <div class="row">
                        <div class="col-12">
                            <!-- Section Informations Générales -->
                            <div class="card mb-3">
                                <div class="card-header bg-primary text-white">
                                    <h6 class="mb-0"><i class="bi bi-info-circle"></i> Informations Générales</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-hash"></i> ID:</strong> ${promo.id_promotion}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-card-text"></i> Code Promotion:</strong> <span class="badge bg-primary">${promo.code_promotion}</span>
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-bar-chart-steps"></i> Niveau:</strong> <span class="badge bg-info">${promo.niveau}</span>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <strong><i class="bi bi-calendar3"></i> Année Académique:</strong> ${promo.annee_academique}
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <strong><i class="bi bi-people"></i> Effectif Maximum:</strong> <span class="badge bg-success">${promo.effectif_max}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Section Affectation -->
                            <div class="card mb-3">
                                <div class="card-header bg-success text-white">
                                    <h6 class="mb-0"><i class="bi bi-book"></i> Affectation</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-2">
                                            <strong><i class="bi bi-book"></i> Filière:</strong> ${promo.nom_filiere || 'Non affectée'}
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <strong><i class="bi bi-building"></i> Faculté:</strong> ${promo.nom_faculte || 'N/A'}
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
                                        <div class="col-md-12 mb-2">
                                            <strong><i class="bi bi-calendar-plus"></i> Date de Création:</strong> ${promo.date_creation || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                
                const modal = new bootstrap.Modal(document.getElementById('modalDetailsPromotion'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement des détails de la promotion');
        }
    });
}

function editPromotion(id) {
    $.ajax({
        url: '../api/promotions.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(promo) {
            if (promo) {
                $('#edit_id_promotion').val(promo.id_promotion);
                $('#edit_code_promotion').val(promo.code_promotion);
                $('#edit_id_filiere_promo').val(promo.id_filiere);
                $('#edit_niveau').val(promo.niveau);
                $('#edit_annee_academique').val(promo.annee_academique);
                $('#edit_effectif_max').val(promo.effectif_max);
                
                const modal = new bootstrap.Modal(document.getElementById('modalEditPromotion'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement de la promotion');
        }
    });
}

function savePromotion() {
    const formData = new FormData(document.getElementById('formAddPromotion'));
    formData.append('action', 'create');
    
    $.ajax({
        url: '../api/promotions.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Promotion ajoutée avec succès');
                bootstrap.Modal.getInstance(document.getElementById('modalAddPromotion')).hide();
                document.getElementById('formAddPromotion').reset();
                loadPromotions();
            } else {
                alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
            }
        },
        error: function() {
            alert('Erreur lors de l\'enregistrement');
        }
    });
}

function updatePromotion() {
    const formData = new FormData(document.getElementById('formEditPromotion'));
    formData.append('action', 'update');
    
    $.ajax({
        url: '../api/promotions.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Promotion modifiée avec succès');
                bootstrap.Modal.getInstance(document.getElementById('modalEditPromotion')).hide();
                loadPromotions();
            } else {
                alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
            }
        },
        error: function() {
            alert('Erreur lors de la modification');
        }
    });
}

function deletePromotion(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
        $.ajax({
            url: '../api/promotions.php',
            method: 'POST',
            data: { action: 'delete', id_promotion: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('Promotion supprimée avec succès');
                    loadPromotions();
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
$('#searchPromotions').on('keyup', function() {
    const value = $(this).val().toLowerCase();
    $('#tbodyPromotions tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});
