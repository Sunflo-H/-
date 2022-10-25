const search = document.querySelector('.search');
        const searchInput = search.querySelector('.search__input');
        const searchEx = search.querySelector('.search__ex');
        const searchExItem = searchEx.querySelectorAll('.search__ex__item')
        const nav = document.querySelector('.nav');
        const navWrapper = document.querySelector('.nav__item-wrapper')
        const navItems = nav.querySelectorAll('.nav__item');

        const searchIcon = search.querySelector('.search__label');

        searchInput.addEventListener('click', e => {
            search.classList.add('active');
            if(searchInput.value !== '') searchEx.classList.add('active');
        })

        searchInput.addEventListener('keyup', e => {
            searchEx.classList.add('active');

        })

        document.addEventListener('click', e => {
            if(e.target !== search 
                && e.target !== searchInput 
                && e.target !== searchEx) {
                search.classList.remove('active');
                searchEx.classList.remove('active');
            }
        })