document.addEventListener('DOMContentLoaded', function () {
    let faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function (item) {
        let question = item.querySelector('.faq-question');
        question.addEventListener('click', function () {
            // Toggle the active class on the clicked item
            item.classList.toggle('active');

            // Hide all other answers
            faqItems.forEach(function (otherItem) {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
        });
    });
});