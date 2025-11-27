// Animation au survol des champs (formulaires)
$(document).ready(function() {
    // Changement de couleur du label au focus
    $('.form-control, .form-select').on('focus', function() {
        $(this).parent().find('.form-label').css('color', '#4d94ff');
    });
    $('.form-control, .form-select').on('blur', function() {
        $(this).parent().find('.form-label').css('color', '#0066cc');
    });
    // Validation en temps réel avec indicateur visuel
    $('input[required], select[required]').on('input change', function() {
        if($(this).val() !== '') {
            $(this).css('border-color', '#28a745');
        } else {
            $(this).css('border-color', '#e0e0e0');
        }
    });
    // Animation du bouton au survol
    $('.btn-generate').hover(
        function() {
            $(this).find('i').css('animation', 'rotate 0.5s linear');
        },
        function() {
            $(this).find('i').css('animation', 'rotate 2s linear infinite');
        }
    );
});

// Animations JS pour la page d'accueil (cards et bouton publier)
document.addEventListener('DOMContentLoaded', function() {
    // Animation sur les cards fichiers
    const cards = document.querySelectorAll('.file-card');
    cards.forEach(card => {
        card.style.transition = 'transform 0.3s, box-shadow 0.3s';
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
    });

    // Animation sur le bouton publier
    const publishBtn = document.querySelector('.btn-outline-light');
    if (publishBtn) {
        publishBtn.addEventListener('mouseenter', () => {
            publishBtn.style.background = '#fff';
            publishBtn.style.color = '#007bff';
            publishBtn.style.boxShadow = '0 4px 16px rgba(0,123,255,0.12)';
        });
        publishBtn.addEventListener('mouseleave', () => {
            publishBtn.style.background = 'none';
            publishBtn.style.color = '#fff';
            publishBtn.style.boxShadow = 'none';
        });
    }

    // Animation sur les boutons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.style.transition = 'transform 0.2s, background-color 0.2s';
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.backgroundColor = '#0056b3';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.backgroundColor = '';
        });
    });
});
