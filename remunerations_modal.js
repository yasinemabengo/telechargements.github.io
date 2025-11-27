$(document).ready(function() {
    let remunerations = [];
    let itemsPerPage = 10;
    let currentPage = 1;
    let filteredRemunerations = [];
    let editId = null;

    function fetchRemunerations() {
        $.ajax({
            url: '../api/remunerations.php',
            method: 'POST',
            data: { action: 'list' },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    remunerations = response.data;
                    filteredRemunerations = remunerations;
                    renderTable();
                    updateTotal();
                    renderPagination();
                }
            }
        });
    }

    function renderTable() {
        let tbody = '';
        let start = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
        let end = itemsPerPage === 'all' ? filteredRemunerations.length : start + parseInt(itemsPerPage);
        let pageData = filteredRemunerations.slice(start, end);
        pageData.forEach(rem => {
            tbody += `<tr>
                <td>
                    <button class='btn btn-sm btn-info' onclick='viewRemuneration(${rem.id_remuneration})' title='Voir détails'><i class='bi bi-eye'></i></button>
                    <button class='btn btn-sm btn-warning' onclick='editRemuneration(${rem.id_remuneration})' title='Modifier'><i class='bi bi-pencil'></i></button>
                    <button class='btn btn-sm btn-danger' onclick='deleteRemuneration(${rem.id_remuneration})' title='Supprimer'><i class='bi bi-trash'></i></button>
                </td>
                <td>${rem.id_remuneration}</td>
                <td>${rem.matricule}</td>
                <td>${rem.nom}</td>
                <td>${rem.postnom}</td>
                <td>${rem.prenom}</td>
                <td>${rem.grade}</td>
                <td>${rem.fonction}</td>
                <td>${rem.salaire}</td>
                <td>${rem.jour}</td>
                <td>${rem.mois}</td>
                <td>${rem.annee}</td>
                <td>${rem.date_remuneration}</td>
            </tr>`;
        });
        $('#tbodyRemunerations').html(tbody);
    }

    function updateTotal() {
        $('#totalRemunerations').text(filteredRemunerations.length + ' rémunérations');
    }

    function renderPagination() {
        // Pagination logic similaire à agent_modal.js
    }

    $('#searchRemunerations').on('input', function() {
        let val = $(this).val().toLowerCase();
        filteredRemunerations = remunerations.filter(rem =>
            rem.nom.toLowerCase().includes(val) ||
            rem.postnom.toLowerCase().includes(val) ||
            rem.prenom.toLowerCase().includes(val) ||
            rem.matricule.toLowerCase().includes(val)
        );
        currentPage = 1;
        renderTable();
        updateTotal();
        renderPagination();
    });

    $('#itemsPerPage').on('change', function() {
        itemsPerPage = $(this).val();
        currentPage = 1;
        renderTable();
        renderPagination();
    });

    // Soumission du formulaire (création ou édition)
    $('#formAddRemuneration').on('submit', function(e) {
        e.preventDefault();
        var formData = $(this).serializeArray();
        if(editId) {
            formData.push({name: 'action', value: 'update'});
            formData.push({name: 'id_remuneration', value: editId});
        } else {
            formData.push({name: 'action', value: 'create'});
        }
        $.ajax({
            url: '../api/remunerations.php',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if(response.success) {
                    alert(editId ? 'Rémunération modifiée !' : 'Rémunération enregistrée !');
                    editId = null;
                    $('#formAddRemuneration')[0].reset();
                    fetchRemunerations();
                } else {
                    alert('Erreur : ' + (response.message || 'Enregistrement impossible'));
                }
            },
            error: function() {
                alert('Erreur de connexion au serveur');
            }
        });
    });

    fetchRemunerations();

    // Remplir le formulaire pour édition
    window.editRemuneration = function(id) {
        let rem = remunerations.find(r => r.id_remuneration == id);
        if(rem) {
            editId = id;
            $('#id_remuneration').val(rem.id_remuneration);
            $('#action').val('update');
            $('#matricule').val(rem.matricule);
            $('#nom').val(rem.nom).trigger('change');
            $('#postnom').val(rem.postnom);
            $('#prenom').val(rem.prenom);
            $('#grade').val(rem.grade);
            $('#fonction').val(rem.fonction);
            $('#salaire').val(rem.salaire);
            $('#jour').val(rem.jour);
            $('#mois').val(rem.mois);
            $('#annee').val(rem.annee);
            $('#date_remuneration').val(rem.date_remuneration);
        }
    }

    // Lorsqu'on soumet le formulaire, si pas d'édition, remet action à create
    $('#formAddRemuneration')[0].reset = function() {
        $('#id_remuneration').val('');
        $('#action').val('create');
        HTMLFormElement.prototype.reset.call(this);
    }

    // Voir plus : affiche les détails dans un modal
    window.viewRemuneration = function(id) {
        let rem = remunerations.find(r => r.id_remuneration == id);
        if(rem) {
            let html = `
            <div class="container py-3">
                <div class="row mb-3">
                    <div class="col">
                        <h4 class="text-primary"><i class="bi bi-cash-coin"></i> Détails de la rémunération</h4>
                    </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="card shadow-sm border-info mb-3">
                            <div class="card-header bg-info text-white"><i class="bi bi-person-badge"></i> Identité</div>
                            <div class="card-body">
                                <p><strong>Matricule :</strong> <span class="badge bg-secondary">${rem.matricule}</span></p>
                                <p><strong>Nom :</strong> ${rem.nom}</p>
                                <p><strong>Postnom :</strong> ${rem.postnom}</p>
                                <p><strong>Prénom :</strong> ${rem.prenom}</p>
                                <p><strong>Grade :</strong> <span class="badge bg-success">${rem.grade}</span></p>
                                <p><strong>Fonction :</strong> <span class="badge bg-warning text-dark">${rem.fonction}</span></p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card shadow-sm border-primary mb-3">
                            <div class="card-header bg-primary text-white"><i class="bi bi-calendar-date"></i> Informations de paiement</div>
                            <div class="card-body">
                                <p><strong>Salaire :</strong> <span class="badge bg-success">${rem.salaire}</span></p>
                                <p><strong>Jour :</strong> ${rem.jour}</p>
                                <p><strong>Mois :</strong> ${rem.mois}</p>
                                <p><strong>Année :</strong> ${rem.annee}</p>
                                <p><strong>Date rémunération :</strong> ${rem.date_remuneration}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            $('#modalBodyDetails').html(html);
            $('#modalDetailsRemuneration').modal('show');
        }
    }

    // Supprimer
    window.deleteRemuneration = function(id) {
        if(confirm('Voulez-vous vraiment supprimer cette rémunération ?')) {
            $.ajax({
                url: '../api/remunerations.php',
                type: 'POST',
                data: { action: 'delete', id_remuneration: id },
                dataType: 'json',
                success: function(response) {
                    if(response.success) {
                        alert('Rémunération supprimée !');
                        fetchRemunerations();
                    } else {
                        alert('Erreur : ' + (response.message || 'Suppression impossible'));
                    }
                },
                error: function() {
                    alert('Erreur de connexion au serveur');
                }
            });
        }
    }
});
