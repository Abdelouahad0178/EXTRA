let currentLanguage = 'fr'; // Default language

// Apply translations to static and dynamic content
function applyTranslations(lang) {
  currentLanguage = lang;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  // Update static elements
  document.querySelectorAll('[data-translate-key]').forEach(element => {
    const key = element.getAttribute('data-translate-key');
    if (translations[key] && translations[key][lang]) {
      element.textContent = translations[key][lang];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
    const key = element.getAttribute('data-translate-placeholder');
    if (translations[key] && translations[key][lang]) {
      element.placeholder = translations[key][lang];
    }
  });

  // Update select options
  document.querySelectorAll('select[data-translate-key] option').forEach(option => {
    const key = option.getAttribute('data-translate-key');
    if (key && translations[key] && translations[key][lang]) {
      option.textContent = translations[key][lang];
    }
  });

  // Update dynamically generated car cards
  document.querySelectorAll('.car-card').forEach(card => {
    // Update badges
    const etatBadge = card.querySelector('.badge-etat');
    if (etatBadge && etatBadge.textContent === translations['not_specified']['fr']) {
      etatBadge.textContent = translations['not_specified'][lang];
    }
    const premiereMainBadge = card.querySelector('.badge-premiere-main');
    if (premiereMainBadge) {
      premiereMainBadge.textContent = translations['first_owner'][lang];
    }

    // Update image placeholders
    const imagePlaceholder = card.querySelector('.car-image-placeholder');
    if (imagePlaceholder) {
      imagePlaceholder.textContent = imagePlaceholder.textContent.includes('Image non disponible') ?
        translations['image_not_available'][lang] : translations['no_image'][lang];
    }

    // Update image counter
    const imageCounter = card.querySelector('.image-counter');
    if (imageCounter) {
      const count = imageCounter.textContent.match(/\d+/)[0];
      imageCounter.textContent = translations['image_counter'][lang].replace('%count%', count);
    }

    // Update buttons
    const whatsappButton = card.querySelector('.btn-contact');
    if (whatsappButton) {
      whatsappButton.textContent = translations['whatsapp_button'][lang];
    }
    const detailsButton = card.querySelector('.btn-details');
    if (detailsButton) {
      detailsButton.textContent = translations['details_button'][lang];
    }
  });

  // Update modal image label if open
  const modalControls = document.querySelector('.modal-controls div');
  if (modalControls) {
    const [current, total] = modalControls.textContent.match(/\d+/g) || [1, 1];
    modalControls.textContent = translations['modal_image_label'][lang]
      .replace('%current%', current)
      .replace('%total%', total);
  }

  // Update stats
  const carStats = document.getElementById('carStats');
  if (carStats && !carStats.textContent.includes('Chargement')) {
    const count = carStats.textContent.match(/\d+/)[0] || 0;
    carStats.textContent = `${count} ${lang === 'fr' ? 'voiture' : 'سيارة'}${count > 1 ? (lang === 'fr' ? 's' : '') : ''} ${lang === 'fr' ? 'affichée' : 'معروضة'}${count > 1 && lang === 'fr' ? 's' : ''}`;
  }
}

// Toggle between French and Arabic
function toggleLanguage() {
  const newLang = currentLanguage === 'fr' ? 'ar' : 'fr';
  applyTranslations(newLang);
  document.getElementById('language-toggle').textContent = newLang === 'fr' ? 'العربية' : 'Français';
}

// Initialize translations
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations('fr');
});