$(document).ready(function() {
    loadFilieres();
    loadPromotions();
    
    // Animation des form-group
    $('.form-group').each(function(index) {
        $(this).css('animation-delay', (index * 0.05) + 's');
    });
});

function loadFilieres() {
    $.ajax({
        url: '../api/filieres.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const select = $('#id_filiere');
            select.empty();
            select.append('<option value="">-- Sélectionner une filière --</option>');
            
            if (data && data.length > 0) {
                data.forEach(function(fil) {
                    select.append(`<option value="${fil.id_filiere}">${fil.nom_filiere}</option>`);
                });
            }
        },
        error: function() {
            alert('Erreur lors du chargement des filières');
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

$('#formAddPromotion').on('submit', function(e) {
    e.preventDefault();
    
    const formData = $(this).serialize();
    const action = $('#id_promotion').val() ? 'update' : 'create';
    
    $.ajax({
        url: '../api/promotions.php',
        method: 'POST',
        data: formData + '&action=' + action,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert(action === 'create' ? 'Promotion ajoutée avec succès' : 'Promotion modifiée avec succès');
                resetForm();
                loadPromotions();
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
                $('#id_promotion').val(promo.id_promotion);
                $('#id_filiere').val(promo.id_filiere);
                $('#code_promotion').val(promo.code_promotion);
                $('#niveau').val(promo.niveau);
                $('#annee_academique').val(promo.annee_academique);
                $('#effectif_max').val(promo.effectif_max);
                
                $('button[type="submit"]').html('<i class="bi bi-check-circle"></i> Modifier');
                
                $('html, body').animate({
                    scrollTop: $('#formAddPromotion').offset().top - 100
                }, 500);
            }
        },
        error: function() {
            alert('Erreur lors du chargement de la promotion');
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

function resetForm() {
    $('#formAddPromotion')[0].reset();
    $('#id_promotion').val('');
    $('#action').val('create');
    $('button[type="submit"]').html('<i class="bi bi-check-circle"></i> Enregistrer');
}

// Recherche dans le tableau
$('#searchPromotions').on('keyup', function() {
    const value = $(this).val().toLowerCase();
    $('#tbodyPromotions tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});
