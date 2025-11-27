$(document).ready(function() {
    loadFilieres();
    loadFacultesInModals();
});

function loadFacultesInModals() {
    $.ajax({
        url: '../api/facultes_api.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const selectAdd = $('#select_faculte_add');
                const selectEdit = $('#edit_id_faculte');
                
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
}

function loadFilieres() {
    $.ajax({
        url: '../api/filieres.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const tbody = $('#tbodyFilieres');
            tbody.empty();
            
            if (!data || data.length === 0) {
                tbody.append(`
                    <tr>
                        <td colspan="7" class="text-center text-muted">
                            <i class="bi bi-inbox"></i> Aucune filière enregistrée
                        </td>
                    </tr>
                `);
                return;
            }
            
            data.forEach(function(fil) {
                const description = fil.description ? 
                    (fil.description.length > 50 ? fil.description.substring(0, 50) + '...' : fil.description) 
                    : 'N/A';
                    
                tbody.append(`
                    <tr>
                        <td>
                            <div class="btn-group btn-group-sm" role="group">
                                <button class="btn btn-info" onclick="viewFiliere(${fil.id_filiere})" title="Voir plus">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-warning" onclick="editFiliere(${fil.id_filiere})" title="Modifier">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-danger" onclick="deleteFiliere(${fil.id_filiere})" title="Supprimer">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                        <td><strong>${fil.id_filiere}</strong></td>
                        <td><span class="badge bg-primary">${fil.code_filiere}</span></td>
                        <td>${fil.nom_filiere}</td>
                        <td>${fil.nom_faculte || 'N/A'}</td>
                        <td><span class="badge bg-info">${fil.niveau_max || 'L3'}</span></td>
                        <td><small>${description}</small></td>
                    </tr>
                `);
            });
        },
        error: function(xhr, status, error) {
            console.error('Erreur:', error);
            $('#tbodyFilieres').html(`
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle"></i> Erreur lors du chargement
                    </td>
                </tr>
            `);
        }
    });
}

function viewFiliere(id) {
    $.ajax({
        url: '../api/filieres.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(fil) {
            if (fil) {
                const modalBody = $('#modalBodyDetailsFiliere');
                
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
                                            <strong><i class="bi bi-hash"></i> ID:</strong> ${fil.id_filiere}
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-card-text"></i> Code Filière:</strong> <span class="badge bg-primary">${fil.code_filiere}</span>
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <strong><i class="bi bi-bar-chart-steps"></i> Niveau Maximum:</strong> <span class="badge bg-info">${fil.niveau_max || 'L3'}</span>
                                        </div>
                                        <div class="col-md-12 mb-2">
                                            <strong><i class="bi bi-book"></i> Nom de la Filière:</strong> ${fil.nom_filiere}
                                        </div>
                                        <div class="col-md-12 mb-2">
                                            <strong><i class="bi bi-building"></i> Faculté:</strong> ${fil.nom_faculte || 'Non affectée'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Section Description -->
                            <div class="card mb-3">
                                <div class="card-header bg-success text-white">
                                    <h6 class="mb-0"><i class="bi bi-text-paragraph"></i> Description</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${fil.description || 'Aucune description disponible'}</p>
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
                                            <strong><i class="bi bi-calendar-plus"></i> Date de Création:</strong> ${fil.date_creation || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                
                const modal = new bootstrap.Modal(document.getElementById('modalDetailsFiliere'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement des détails de la filière');
        }
    });
}

function deleteFiliere(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette filière ?')) {
        $.ajax({
            url: '../api/filieres.php',
            method: 'POST',
            data: { action: 'delete', id_filiere: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('Filière supprimée avec succès');
                    loadFilieres();
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

function editFiliere(id) {
    $.ajax({
        url: '../api/filieres.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(fil) {
            if (fil) {
                $('#edit_id_filiere').val(fil.id_filiere);
                $('#edit_code_filiere').val(fil.code_filiere);
                $('#edit_nom_filiere').val(fil.nom_filiere);
                $('#edit_id_faculte').val(fil.id_faculte);
                $('#edit_niveau_max').val(fil.niveau_max || 'L3');
                $('#edit_description').val(fil.description);
                
                const modal = new bootstrap.Modal(document.getElementById('modalEditFiliere'));
                modal.show();
            }
        },
        error: function() {
            alert('Erreur lors du chargement de la filière');
        }
    });
}

function saveFiliere() {
    const formData = new FormData(document.getElementById('formAddFiliere'));
    formData.append('action', 'create');
    
    $.ajax({
        url: '../api/filieres.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Filière ajoutée avec succès');
                bootstrap.Modal.getInstance(document.getElementById('modalAddFiliere')).hide();
                document.getElementById('formAddFiliere').reset();
                loadFilieres();
            } else {
                alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
            }
        },
        error: function() {
            alert('Erreur lors de l\'enregistrement');
        }
    });
}

function updateFiliere() {
    const formData = new FormData(document.getElementById('formEditFiliere'));
    formData.append('action', 'update');
    
    $.ajax({
        url: '../api/filieres.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Filière modifiée avec succès');
                bootstrap.Modal.getInstance(document.getElementById('modalEditFiliere')).hide();
                loadFilieres();
            } else {
                alert('Erreur: ' + (response.message || 'Une erreur est survenue'));
            }
        },
        error: function() {
            alert('Erreur lors de la modification');
        }
    });
}

// Recherche dans le tableau
$('#searchFilieres').on('keyup', function() {
    const value = $(this).val().toLowerCase();
    $('#tbodyFilieres tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});
