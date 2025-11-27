// Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('mot_de_passe');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle icon
    this.classList.toggle('bi-eye-fill');
    this.classList.toggle('bi-eye-slash-fill');
});

// Gestion du formulaire de connexion avec animation
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const overlay = document.getElementById('loadingOverlay');
    const loaderCircle = document.getElementById('loaderCircle');
    const loaderText = document.getElementById('loaderText');
    const loaderPercentage = document.getElementById('loaderPercentage');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    // Cacher les erreurs précédentes
    errorAlert.classList.add('d-none');
    
    // Afficher l'overlay
    overlay.classList.add('active');
    
    // Envoyer la requête AJAX
    fetch('index.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Succès - Animation rapide vers 100%
            loaderText.textContent = 'Connexion réussie !';
            loaderCircle.classList.remove('error');
            loaderPercentage.classList.remove('error');
            
            let percentage = 0;
            const successInterval = setInterval(() => {
                percentage += 5;
                loaderPercentage.textContent = percentage + '%';
                
                if (percentage >= 100) {
                    clearInterval(successInterval);
                    // Rediriger vers admin.php
                    window.location.href = 'admin.php';
                }
            }, 30); // Rapide : 30ms par étape
            
        } else {
            // Échec - Animation lente vers 10% en rouge
            loaderText.textContent = 'Échec de connexion';
            loaderCircle.classList.add('error');
            loaderPercentage.classList.add('error');
            
            let percentage = 0;
            const errorInterval = setInterval(() => {
                percentage += 1;
                loaderPercentage.textContent = percentage + '%';
                
                if (percentage >= 10) {
                    clearInterval(errorInterval);
                    
                    // Attendre 1 seconde puis cacher l'overlay
                    setTimeout(() => {
                        overlay.classList.remove('active');
                        loaderCircle.classList.remove('error');
                        loaderPercentage.classList.remove('error');
                        loaderPercentage.textContent = '0%';
                        loaderText.textContent = 'Connexion en cours...';
                        
                        // Afficher le message d'erreur
                        errorMessage.textContent = data.message || "Nom d'utilisateur ou mot de passe incorrect";
                        errorAlert.classList.remove('d-none');
                    }, 1000);
                }
            }, 100); // Lent : 100ms par étape
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        overlay.classList.remove('active');
        errorMessage.textContent = 'Erreur de connexion au serveur';
        errorAlert.classList.remove('d-none');
    });
});
