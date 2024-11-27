(() => {
    "use strict";

    const BODY = document.querySelector("body");
    const animaList = [".titlebox", ".service__link", ".advantage__section", ".service", ".titlepage__content", ".about__article", ".service__body", ".advantage__section", ".contacts__body", ".footer__body"];
    //список елементов что нужно анимировать
    adaptBoard();
    preloader(".loader__progress", ".loader__text");
    moveAnchors();
    isWebp();
    function isWebp() {
        //добавляет класс если браузер потдерживает webp
        function testWebP(callback) {
            let webP = new Image;
            webP.onload = webP.onerror = function () {
                callback(webP.height == 2);
            };
            webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
        }
        testWebP((function (support) {
            let className = support === true ? "webp" : "no-webp";
            document.documentElement.classList.add(className);
        }));
    }
    function moveAnchors() {
        //плавно скролит до якоря
        document.addEventListener("click", anchorsClick);
        function anchorsClick(e) {
            if (e.target.closest('a[href^="#"]')) {
                e.preventDefault();
                const anchor = e.target.closest('a[href^="#"]');
                const href = anchor.getAttribute("href");
                if (href.length > 1) {
                    const hrefTarget = document.querySelector("" + href);
                    if (hrefTarget) hrefTarget.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }
        }
    }
    function adaptBoard() {
        //data-flex-fr="columns,change columns width,-//-"вешаем на обертку
        //важно использовать флекс базис в CSS 
        function getFlexFrData() {
            //получение данных по елементам с данным атребутом
            const boardList = document.querySelectorAll("[data-flex-fr]");
            const objList = [];
            if (boardList.length > 0) {
                boardList.forEach((board => {
                    const boardData = {
                        elem: board,
                        dataValue: getDataValueList(board, "flexFr")
                    };
                    objList.push(boardData);
                }));
                return objList;
            }
        }
        function getDataValueList(elem, propertyName) {
            //превращение данных дата-атребута в список
            let propertyValue = elem.dataset[propertyName];
            if (propertyValue) propertyValue = propertyValue.split(",");
            return propertyValue;
        }
        const flexFrData = getFlexFrData();
        resizeFlexFr(flexFrData);
        window.addEventListener("resize", boardResize);
        function boardResize() {
            resizeFlexFr(flexFrData);
        }
        function resizeFlexFr(base) {
            if (base.length > 0) base.forEach((baseItem => {
                const cardBoard = baseItem.elem;
                const cardList = Array.from(cardBoard.children);
                const column = getColumn(baseItem.dataValue);
                const cardBoardWidth = cardBoard.offsetWidth;
                const gap = getGapSize(cardBoard);
                const sortElems = sortCard(cardList).elems;//елементы сортированые по размеру
                const rations = sortCard(cardList).rations;//список соотношений размера
                const frSumm = getFrSumm(column, rations);//получение суммы соотношений
                const frWidth = getFrWidth(frSumm, cardBoardWidth, gap, column);//получение реального размера наименьшего элемента
                addMaxWidthToCard(frWidth, sortElems, rations);
            }));
        }


        function getGapSize(elem) {
            let gapValue = parseFloat(window.getComputedStyle(elem).columnGap);
            return gapValue;
        }
        function addMaxWidthToCard(fr, cards, rations) {
            for (let num = 0; num < cards.length; num++) {
                let realWidth = fr * rations[num];
                realWidth = Math.floor(realWidth);
                cards[num].forEach((card => {
                    card.style.maxWidth = `${realWidth}px`;
                }));
            }
        }
        function getFrWidth(sum, boardWidth, gap, column) {
            let resolt = boardWidth - Math.ceil(gap * (column - 1));
            resolt /= sum;
            return resolt;
        }
        function getFrSumm(column, ratioList) {
            let summ = ratioList.reduce((function (accumulator, currentValue) {
                return accumulator + currentValue;
            }), 0);
            if (ratioList.length < column) summ += column - ratioList.length;
            return summ;
        }
        function getColumn(arr) {
            //arr- список значений дата-атребута
            let column = arr[0];
            let q = 0;
            for (let i = 1; i < arr.length; i++) if (window.innerWidth <= arr[i]) ++q;
            column -= q;
            return column;
        }
        function sortCard(list) {
            //создание обьекта с елементами и их соотношениями
            if (list.length > 0) {
                const cardData = [];
                const sortElemList = [];
                const ratioList = [];
                const widthSet = getBasisSet(list);

                widthSet.forEach((setElem => {
                    const itemList = [];
                    list.forEach((listElem => {
                        if (getFlexBasis(listElem) == setElem) itemList.push(listElem);
                    }));
                    sortElemList.push(itemList);
                    ratioList.push(setElem / widthSet[0]);
                }));
                cardData.elems = sortElemList;
                cardData.rations = ratioList;
                return cardData;
            }
        }
        function getBasisSet(cardList) {
            //получение списка флекс базисов карт
            let arr = [];
            cardList.forEach((card => {
                const cardBasis = getFlexBasis(card);
                arr.push(cardBasis);
            }));
            arr.sort();
            arr = new Set(arr);
            arr = Array.from(arr);
            return arr;
        }
        function getFlexBasis(elem) {
            let basis = window.getComputedStyle(elem).flexBasis;
            basis = parseFloat(basis);
            return basis;
        }
    }
    function lazyLoad() {
        //data-lazy-- кидаем на обертку
        //data-src--адреса картинок
        //скрипт работает для карт с ОДНОЙ КАРИТНКОЙ для подгрузки в каждой карте
        let lazyList = document.querySelectorAll("[data-lazy]");
        if (lazyList.length > 0) {
            const observerOptions = {
                root: null,
                threshold: .2
            };
            const observerCallback = function (entres, observer) {
                entres.forEach((entry => {
                    if (entry.isIntersecting) {
                        loadPicture(entry.target);
                        observer.unobserve(entry.target);
                    }
                }));
            };
            var observer = new IntersectionObserver(observerCallback, observerOptions);
            lazyList.forEach((lazyBoard => {
                observer.observe(lazyBoard);
            }));
            function loadPicture(wrapper) {
                //создание последовательной загрузки картинок
                const cardList = Array.from(wrapper.children);
                if (cardList.length > 0) {
                    let num = 0;
                    let picture;
                    addLoadAction();
                    function addLoadAction() {
                        picture = cardList[num].querySelector("[data-src]");
                        if (picture) {
                            const pictureClone = new Image;
                            pictureClone.src = picture.dataset.src;
                            pictureClone.onload = setSrc;
                            pictureClone.onerror = setSrc;
                        }
                    }
                    function setSrc() {
                        setTimeout((() => {
                            cardList[num].classList.add("card-load");
                            if (picture) picture.src = picture.dataset.src;
                            num++;
                            if (num < cardList.length) addLoadAction();
                        }), 200);
                    }
                }
            }
        }
    }
    function preloader(line, text) {
        const lineElem = document.querySelector(line);
        const textElem = document.querySelector(text);
        const imglist = document.querySelectorAll("img");
        let imgCount = 0;
        let value;
        if (lineElem) lineElem.style.left = `0%`;
        if (textElem) textElem.innerText = `0%`;
        if (imglist.length > 0) imglist.forEach((image => {
            let imageClone = new Image;
            imageClone.src = image.src;
            imageClone.onload = loadCount;
            imageClone.onerror = loadCount;
        }));
        function loadCount() {
            ++imgCount;
            value = imgCount / imglist.length * 100;
            value = Math.round(value);
            if (lineElem) lineElem.style.left = `${value}%`;
            if (textElem) textElem.innerText = `${value}%`;
            if (value == 100) setTimeout(docLoad, 1e3);
        }
    }
    function docLoad() {
        BODY.classList.add("load");
        lazyLoad();
        addAnima();
    }
    function addAnima() {
        const option = {
            root: null,
            threshold: .3
        };
        var callbackFunc = function (entres, observer) {
            entres.forEach((entry => {
                if (entry.isIntersecting) entry.target.classList.add("anima");
                if (!entry.isIntersecting) entry.target.classList.remove("anima");
            }));
        };
        var observer = new IntersectionObserver(callbackFunc, option);
        if (animaList.length > 0) animaList.forEach((animaElem => {
            addElemsInObserver(animaElem);
        }));
        function addElemsInObserver(selector) {
            let blockList;
            if (typeof selector == "string") blockList = document.querySelectorAll(selector);
            if (typeof selector == "object") blockList = selector;
            blockList = Array.from(blockList);
            if (blockList.length > 0) blockList.forEach((block => {
                observer.observe(block);
            }));
        }
    }
})();