$(document).ready(function() {
    console.log('Document ready - début chargement');
    loadCours();
    loadEnseignants();
    console.log('Fonctions de chargement appelées');
    
    // Gestion de la soumission du formulaire
    $('#formAddCours').on('submit', function(e) {
        e.preventDefault();
        saveCours();
    });
    
    // Gestion du changement d'enseignant
    $('#nom_enseignant').on('change', function() {
        console.log('Enseignant sélectionné:', $(this).val());
        const selectedOption = $(this).find('option:selected');
        const idEnseignant = selectedOption.data('id');
        console.log('ID enseignant:', idEnseignant);
        $('#id_enseignant').val(idEnseignant || '');
    });
});

function saveCours() {
    const isUpdate = $('#id_cours_hidden').length > 0;
    const formData = $('#formAddCours').serialize() + '&action=' + (isUpdate ? 'update' : 'create');
    
    $.ajax({
        url: '../api/cours.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert(isUpdate ? 'Cours modifié avec succès !' : 'Cours enregistré avec succès !');
                resetForm();
                loadCours();
            } else {
                alert('Erreur: ' + (response.message || 'Impossible d\'enregistrer le cours'));
            }
        },
        error: function(xhr, status, error) {
            alert('Erreur lors de l\'enregistrement: ' + error);
        }
    });
}

function loadCours() {
    $.ajax({
        url: '../api/cours.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const tbody = $('#tbodyCours');
            tbody.empty();
            data.forEach(function(cours) {
                tbody.append(`
                    <tr>
                        <td>${cours.id_cours}</td>
                        <td><span class="badge bg-primary">${cours.code_cours}</span></td>
                        <td>${cours.nom_cours}</td>
                        <td><span class="badge bg-success">${cours.credits}</span></td>
                        <td>${cours.volume_horaire}h</td>
                        <td><span class="badge bg-info">${cours.type_cours}</span></td>
                        <td>${cours.nom_enseignant || 'Non assigné'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="editCours(${cours.id_cours})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteCours(${cours.id_cours})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `);
            });
        },
        error: function() {
            $('#tbodyCours').html('<tr><td colspan="8" class="text-center text-danger">Erreur lors du chargement des cours</td></tr>');
        }
    });
}

function loadEnseignants() {
    $.ajax({
        url: '../api/enseignants.php?action=list',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            console.log('Enseignants chargés:', data); // Debug
            let html = '<option value="">-- Sélectionner un enseignant --</option>';
            if (data && data.length > 0) {
                data.forEach(function(ens) {
                    const nom = ens.nom || '';
                    const postnom = ens.postnom || '';
                    const prenom = ens.prenom || '';
                    const nomComplet = `${nom} ${postnom} ${prenom}`.trim();
                    html += `<option value="${nomComplet}" data-id="${ens.id_enseignant}">${nomComplet}</option>`;
                });
            } else {
                html += '<option value="">Aucun enseignant trouvé</option>';
            }
            $('#nom_enseignant').html(html);
            console.log('Dropdown enseignants rempli'); // Debug
        },
        error: function(xhr, status, error) {
            console.error('Erreur chargement enseignants:', error, xhr.responseText); // Debug
            $('#nom_enseignant').html('<option value="">Erreur de chargement</option>');
        }
    });
}

// Filtrage de recherche
$('#searchCours').on('keyup', function() {
    const value = $(this).val().toLowerCase();
    $('#tbodyCours tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});

function editCours(id) {
    $.ajax({
        url: '../api/cours.php?action=get&id=' + id,
        method: 'GET',
        dataType: 'json',
        success: function(cours) {
            // Remplir le formulaire avec les données du cours
            $('#code_cours').val(cours.code_cours);
            $('#nom_cours').val(cours.nom_cours);
            $('#credits').val(cours.credits);
            $('#volume_horaire').val(cours.volume_horaire);
            $('#type_cours').val(cours.type_cours);
            $('#id_enseignant').val(cours.id_enseignant || '');
            
            // Sélectionner l'enseignant dans le dropdown
            if (cours.nom_enseignant) {
                $('#nom_enseignant').val(cours.nom_enseignant);
            }
            
            $('#description').val(cours.description || '');
            
            // Ajouter un champ caché pour l'ID et changer le mode en update
            if ($('#id_cours_hidden').length === 0) {
                $('#formAddCours').prepend('<input type="hidden" id="id_cours_hidden" name="id_cours">');
            }
            $('#id_cours_hidden').val(cours.id_cours);
            
            // Changer le bouton submit
            $('#formAddCours button[type="submit"]').html('<i class="bi bi-save"></i> Mettre à jour');
            
            // Scroll vers le formulaire
            $('html, body').animate({
                scrollTop: $('#formAddCours').offset().top - 100
            }, 500);
        },
        error: function() {
            alert('Erreur lors du chargement des données du cours');
        }
    });
}

function updateCours() {
    const formData = $('#formAddCours').serialize() + '&action=update';
    
    $.ajax({
        url: '../api/cours.php',
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                alert('Cours modifié avec succès !');
                resetForm();
                loadCours();
            } else {
                alert('Erreur: ' + (response.message || 'Impossible de modifier le cours'));
            }
        },
        error: function() {
            alert('Erreur lors de la modification du cours');
        }
    });
}

function resetForm() {
    $('#formAddCours')[0].reset();
    $('#id_cours_hidden').remove();
    $('#formAddCours button[type="submit"]').html('<i class="bi bi-check-circle"></i> Enregistrer');
}

function deleteCours(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
        $.ajax({
            url: '../api/cours.php',
            method: 'POST',
            data: { action: 'delete', id_cours: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    alert('Cours supprimé avec succès');
                    loadCours();
                } else {
                    alert('Erreur: ' + response.message);
                }
            },
            error: function() {
                alert('Erreur lors de la suppression du cours');
            }
        });
    }
}
