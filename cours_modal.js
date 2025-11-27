$(document).ready(function() {
    loadCours();
    
    // Recherche en temps réel
    $('#searchCours').on('keyup', function() {
        const searchText = $(this).val().toLowerCase();
        $('#tbodyCours tr').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(searchText) > -1);
        });
    });
});

function loadCours() {
    console.log('Chargement des cours depuis cours_modal.php...');
    $.ajax({
        url: '../api/cours.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            console.log('Données reçues:', data);
            let html = '';
            
            if (!data || data.length === 0) {
                html = `
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                            <p class="mt-2 text-muted">Aucun cours trouvé</p>
                            <a href="../views/ajout_cours.php" class="btn btn-sm btn-success">
                                <i class="bi bi-plus-circle"></i> Ajouter le premier cours
                            </a>
                        </td>
                    </tr>
                `;
            } else {
                data.forEach(function(cours) {
                    const typeBadge = getTypeBadge(cours.type_cours);
                    html += `
                        <tr>
                            <td><span class="badge bg-secondary">#${cours.id_cours}</span></td>
                            <td><strong>${cours.code_cours}</strong></td>
                            <td>${cours.nom_cours}</td>
                            <td><span class="badge bg-info">${cours.credits} CR</span></td>
                            <td>${cours.volume_horaire}h</td>
                            <td>${typeBadge}</td>
                            <td>${cours.nom_enseignant || '<em class="text-muted">Non assigné</em>'}</td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="viewCours(${cours.id_cours})" title="Voir plus">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="transferCoursToPromotion(${cours.id_cours}, '${cours.code_cours}', '${cours.nom_cours}', ${cours.credits})" title="Transférer à une promotion">
                                    <i class="bi bi-arrow-right-circle"></i> Transférer
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="editCours(${cours.id_cours})" title="Modifier">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteCours(${cours.id_cours}, '${cours.nom_cours}')" title="Supprimer">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            $('#tbodyCours').html(html);
        },
        error: function(xhr, status, error) {
            console.error('Erreur AJAX:', xhr.responseText);
            console.error('Status:', status, 'Error:', error);
            $('#tbodyCours').html(`
                <tr>
                    <td colspan="8" class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
                        <p class="mt-2">Erreur lors du chargement des cours</p>
                        <p class="small text-muted">${error}</p>
                        <button class="btn btn-sm btn-primary" onclick="loadCours()">
                            <i class="bi bi-arrow-clockwise"></i> Réessayer
                        </button>
                    </td>
                </tr>
            `);
        }
    });
}

function getTypeBadge(type) {
    const badges = {
        'Théorique': '<span class="badge bg-primary">Théorique</span>',
        'Pratique': '<span class="badge bg-success">Pratique</span>',
        'TP': '<span class="badge bg-warning text-dark">TP</span>',
        'TD': '<span class="badge bg-info">TD</span>'
    };
    return badges[type] || '<span class="badge bg-secondary">' + type + '</span>';
}

function viewCours(id) {
    $.ajax({
        url: '../api/cours.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(cours) {
            // Stocker l'ID du cours pour les actions depuis le modal
            $('#modalViewCours').data('coursId', cours.id_cours);
            $('#modalViewCours').data('coursNom', cours.nom_cours);
            
            // Remplir les champs du modal
            $('#view_id_cours').text(cours.id_cours || '-');
            $('#view_code_cours').text(cours.code_cours || '-');
            $('#view_nom_cours').text(cours.nom_cours || '-');
            $('#view_credits').html('<span class="badge bg-info">' + (cours.credits || '0') + ' CR</span>');
            $('#view_volume_horaire').text((cours.volume_horaire || '0') + 'h');
            $('#view_type_cours').html(getTypeBadge(cours.type_cours));
            $('#view_id_enseignant').text(cours.id_enseignant || '-');
            $('#view_nom_enseignant').text(cours.nom_enseignant || '-');
            
            // Nettoyer la description des balises HTML si elle en contient
            var description = cours.description || '-';
            if (description && description !== '-') {
                // Enlever les balises HTML
                description = description.replace(/<[^>]*>/g, '');
                // Si après nettoyage c'est vide, mettre un tiret
                description = description.trim() || '-';
            }
            $('#view_description').text(description);
            
            // Ouvrir le modal
            var modalView = new bootstrap.Modal(document.getElementById('modalViewCours'));
            modalView.show();
        },
        error: function() {
            showMessage('Erreur lors du chargement des données', 'danger');
        }
    });
}

function editCoursFromView() {
    const coursId = $('#modalViewCours').data('coursId');
    $('#modalViewCours').modal('hide');
    setTimeout(() => {
        editCours(coursId);
    }, 300);
}

function deleteCoursFromView() {
    const coursId = $('#modalViewCours').data('coursId');
    const coursNom = $('#modalViewCours').data('coursNom');
    $('#modalViewCours').modal('hide');
    setTimeout(() => {
        deleteCours(coursId, coursNom);
    }, 300);
}

function editCours(id) {
    $.ajax({
        url: '../api/cours.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(cours) {
            $('#edit_id_cours').val(cours.id_cours);
            $('#edit_code_cours').val(cours.code_cours);
            $('#edit_nom_cours').val(cours.nom_cours);
            $('#edit_credits').val(cours.credits);
            $('#edit_volume_horaire').val(cours.volume_horaire);
            $('#edit_type_cours').val(cours.type_cours);
            $('#edit_id_enseignant').val(cours.id_enseignant || '');
            $('#edit_nom_enseignant').val(cours.nom_enseignant || '');
            $('#edit_description').val(cours.description || '');
            
            var modalEdit = new bootstrap.Modal(document.getElementById('modalEditCours'));
            modalEdit.show();
        },
        error: function() {
            showMessage('Erreur lors du chargement des données', 'danger');
        }
    });
}

function updateCours() {
    const formData = $('#formEditCours').serialize() + '&action=update';
    
    $.ajax({
        url: '../api/cours.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showMessage('Cours modifié avec succès', 'success');
                $('#modalEditCours').modal('hide');
                loadCours();
            } else {
                showMessage('Erreur: ' + (response.message || 'Impossible de modifier'), 'danger');
            }
        },
        error: function() {
            showMessage('Erreur lors de la modification', 'danger');
        }
    });
}

function deleteCours(id, nom) {
    if (confirm('Voulez-vous vraiment supprimer le cours "' + nom + '" ?')) {
        $.ajax({
            url: '../api/cours.php?action=delete',
            method: 'POST',
            data: { id_cours: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showMessage('Cours supprimé avec succès', 'success');
                    loadCours();
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

function transferCoursToPromotion(id_cours, code_cours, nom_cours, credits) {
    // Sauvegarder les infos du cours dans sessionStorage
    sessionStorage.setItem('transfer_cours', JSON.stringify({
        id_cours: id_cours,
        code_cours: code_cours,
        nom_cours: nom_cours,
        credits: credits
    }));
    
    // Rediriger vers la page d'attribution
    window.location.href = 'cours_promotions_modal.php?transfer=1';
}
