// ==UserScript==
// @name         Twitch Mention Tracker with Clear Button
// @namespace    http://tampermonkey.net/
// @version      4.10
// @description  Отслеживает упоминания никнейма в чате Twitch.
// @author       tapeavion
// @match        https://www.twitch.tv/*
// @icon         https://avatars.mds.yandex.net/i?id=52f9cfd7a6b7f1f96c220763a1dc5aa181255f26-5869346-images-thumbs&n=13
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    console.log('Скрипт Twitch Mention Tracker запущен.');

    // Список для хранения отслеживаемых сообщений
    const PINGED_STORAGE_KEY = 'pingedMessagesofChatters';
    let pingedMessagesofChatters = JSON.parse(GM_getValue(PINGED_STORAGE_KEY, '[]'));
    console.log('Загружено сообщений из хранилища:', pingedMessagesofChatters.length);

    const TARGET_NICKNAME = '@tapeavion';

    const CLOSE_ICON_URL = "https://github.com/sopernik566/icons/blob/main/close-icon.png?raw=true";
    const OPEN_ICON_URL = "https://github.com/sopernik566/icons/blob/main/open-icon.png?raw=true";
    const DELETE_ICON_URL = "https://www.svgrepo.com/show/335996/delete.svg";

    // Создание интерфейса
    const createUI = () => {
        console.log('Создание интерфейса...');

        const mentionBubble = document.createElement('div');
        mentionBubble.id = 'mentionBubble';
        mentionBubble.style.position = 'fixed';
        mentionBubble.style.top = '10px';
        mentionBubble.style.right = '232px';
        mentionBubble.style.width = '30px';
        mentionBubble.style.height = '30px';
        mentionBubble.style.borderRadius = '50%';
        mentionBubble.style.backgroundColor = '#b74141';
        mentionBubble.style.color = '#fff';
        mentionBubble.style.display = 'flex';
        mentionBubble.style.justifyContent = 'center';
        mentionBubble.style.alignItems = 'center';
        mentionBubble.style.cursor = 'pointer';
        mentionBubble.style.fontWeight = 'bold';
        mentionBubble.style.zIndex = '10000';
        mentionBubble.textContent = '0';
        document.body.appendChild(mentionBubble);

        mentionBubble.addEventListener('mouseenter', () => {
            mentionBubble.style.backgroundColor = '#b96857';
        });

        mentionBubble.addEventListener('mouseleave', () => {
            mentionBubble.style.backgroundColor = '#d13e3e';
        });

        const mentionList = document.createElement('div');
        mentionList.id = 'mentionList';
        mentionList.style.position = 'fixed';
        mentionList.style.top = '50px';
        mentionList.style.right = '320px';
        mentionList.style.padding = '10px';
        mentionList.style.height = '480px';
        mentionList.style.width = '500px';
        mentionList.style.background = 'linear-gradient(315deg, hsla(285, 61%, 12%, 1) 0%, hsla(186, 26%, 21%, 1) 55%, hsla(284, 9%, 48%, 1) 100%)';
        mentionList.style.color = '#fff';
        mentionList.style.border = '1px solid #9146FF';
        mentionList.style.borderRadius = '8px';
        mentionList.style.overflowY = 'auto';
        mentionList.style.display = 'none';
        mentionList.style.zIndex = '10000';
        mentionList.style.boxShadow = 'rgb(0 0 0) 0px 0px 40px 9px';
        mentionList.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        mentionList.style.opacity = '0';
        mentionList.style.transform = 'translateY(-10px)';
        document.body.appendChild(mentionList);

        const globalClearButton = document.createElement('button');
        globalClearButton.id = 'globalClearButton';
        globalClearButton.style.position = 'absolute';
        globalClearButton.style.top = '13px';
        globalClearButton.style.right = '10px';
        globalClearButton.style.backgroundColor = 'transparent';
        globalClearButton.style.border = 'none';
        globalClearButton.style.cursor = 'pointer';
        globalClearButton.style.padding = '0';
        globalClearButton.style.zIndex = '10001';

        const globalClearIcon = document.createElement('img');
        globalClearIcon.src = DELETE_ICON_URL;
        globalClearIcon.alt = 'Очистить все';
        globalClearIcon.style.width = '25px';
        globalClearIcon.style.height = '25px';
        globalClearButton.appendChild(globalClearIcon);

        globalClearButton.addEventListener('click', () => {
            console.log('Очистка всех упоминаний...');
            mentionCount = 0;
            Object.keys(mentions).forEach(nickname => delete mentions[nickname]);
            Object.keys(expandedState).forEach(nickname => delete expandedState[nickname]);
            pingedMessagesofChatters = [];
            GM_setValue(PINGED_STORAGE_KEY, JSON.stringify(pingedMessagesofChatters));
            updateMentionBubble();
            updateMentionList();
        });

        mentionList.appendChild(globalClearButton);
        document.body.appendChild(mentionList);

        console.log('Интерфейс создан.');
        return { mentionBubble, mentionList, globalClearButton };
    };

    const { mentionBubble, mentionList } = createUI();

    let mentionCount = 0;
    const mentions = {};
    const expandedState = {};

    // Обновление счетчика упоминаний
    const updateMentionBubble = () => {
        console.log('Обновление счетчика упоминаний:', mentionCount);
        mentionBubble.textContent = mentionCount > 0 ? mentionCount : '0';
    };

    // Обработка нового упоминания
    const handleMention = (nickname, message) => { 
        console.log("Новое упоминание:", nickname, message);
    
        if (!mentions[nickname]) {
            mentions[nickname] = [];
        }
    
        const mention = { nickname, message, timestamp: Date.now() };
        mentions[nickname].push(mention);
        mentionCount++;
    
        pingedMessagesofChatters.push(mention);
        GM_setValue(PINGED_STORAGE_KEY, JSON.stringify(pingedMessagesofChatters));
    
        updateMentionBubble();
    };
    
    // Создание кнопки для сворачивания/разворачивания
const createToggleButton = (nickname, isCollapsed, toggleFunction) => {
    console.log('Создание кнопки для сворачивания/разворачивания:', nickname);

    const toggleButton = document.createElement('button');
    toggleButton.style.marginLeft = '10px';
    toggleButton.style.marginRight = '38px';
    toggleButton.style.border = 'none';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.padding = '3px';
    toggleButton.style.background = isCollapsed ? '#9146ff' : '#b86e00'; // Цвет зависит от состояния
    toggleButton.style.borderRadius = '25px';
    toggleButton.style.transition = 'background 0.2s ease';

    const icon = document.createElement('img');
    icon.src = isCollapsed ? OPEN_ICON_URL : CLOSE_ICON_URL;
    icon.style.width = '25px';
    icon.style.height = '25px';
    icon.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

    toggleButton.appendChild(icon);

    toggleButton.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        expandedState[nickname] = !isCollapsed;

        // Изменяем фон кнопки в зависимости от состояния
        toggleButton.style.backgroundColor = isCollapsed ? '#9146ff' : '#b86e00';

        // Переключаем состояние кнопки
        icon.style.opacity = '0';
        icon.style.transform = 'scale(1.5)';

        setTimeout(() => {
            icon.src = isCollapsed ? OPEN_ICON_URL : CLOSE_ICON_URL;
            icon.style.opacity = '1';
            icon.style.transform = 'scale(1)';
        }, 200); // Время должно совпадать с transition

        const userMessages = toggleButton.parentElement.nextSibling;
        if (userMessages) {
            userMessages.style.maxHeight = isCollapsed ? '0' : '465px';
            userMessages.style.opacity = isCollapsed ? '0' : '1';
        }

        toggleFunction(isCollapsed);
    });

    return toggleButton;
};



    // Обновление списка упоминаний
    const updateMentionList = () => {
        console.log('Обновление списка упоминаний...');

        const globalClearButton = document.getElementById('globalClearButton');
        mentionList.innerHTML = '';
        mentionList.appendChild(globalClearButton);

        if (mentionCount === 0) {
            const noMentions = document.createElement('div');
            noMentions.textContent = 'Нет сообщений';
            noMentions.style.padding = '10px';
            noMentions.style.color = '#aaa';
            noMentions.style.textAlign = 'center';
            mentionList.appendChild(noMentions);
            return;
        }

        Object.keys(mentions).forEach((nickname) => {
            const mentionItem = document.createElement('div');
           mentionItem.style.padding = '8px';
           mentionItem.style.borderBottom = '2px solid #987aae';

            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';

            const nicknameLabel = document.createElement('span');
            nicknameLabel.textContent = `${nickname} (${mentions[nickname].length})`;

            const isCollapsed = !expandedState[nickname];
            const toggleButton = createToggleButton(nickname, isCollapsed, (newState) => {
                expandedState[nickname] = !newState;
                const userMessages = toggleButton.parentElement.nextSibling;
                if (userMessages) {
                    userMessages.style.maxHeight = newState ? '0' : '470px';
                    userMessages.style.opacity = newState ? '0' : '1';
                }
            });

            header.appendChild(nicknameLabel);
            header.appendChild(toggleButton);
            mentionItem.appendChild(header);

            const messagesContainer = document.createElement('div');
           messagesContainer.style.position = 'absolute';
           messagesContainer.style.border = '3px solid rgb(123, 93, 145)';
           messagesContainer.style.padding = '4px';
           messagesContainer.style.display = 'block';
           messagesContainer.style.backgroundColor = 'rgb(33, 28, 36)';
           messagesContainer.style.borderRadius = '7px';
           messagesContainer.style.width = '380px';
           messagesContainer.style.overflowY = 'auto';
           messagesContainer.style.maxHeight = expandedState[nickname] ? '470px' : '0';
           messagesContainer.style.opacity = expandedState[nickname] ? '1' : '0';
           messagesContainer.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
           messagesContainer.style.boxShadow = 'rgb(0 0 0 / 69%) 16px 17px 34px 7px';



            mentions[nickname].forEach((mention) => {
                const messageText = document.createElement('div');
                messageText.textContent = mention.message;
                messageText.style.padding = '5px 0px';
                messageText.style.color = 'rgb(204, 204, 204)';
                messageText.style.borderBottom = '2px solid rgb(123 93 145)';

                const deleteButton = document.createElement('button');
               deleteButton.style.marginLeft = '295px';
               deleteButton.style.marginTop = '15px';
               deleteButton.style.background = 'none';
               deleteButton.style.border = 'none';
               deleteButton.style.color = '#b293c9'; // новый цвет
               deleteButton.style.cursor = 'pointer';
               deleteButton.textContent = 'Delete';
               deleteButton.style.backgroundColor = '#7b5d9152';
               deleteButton.style.borderRadius = '10px';
               deleteButton.style.width = '65px';
               deleteButton.style.display = 'flex';
               deleteButton.style.alignItems = 'center';
               deleteButton.style.justifyContent = 'center';


                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mentionCount--;
                    updateMentionBubble();

                    mentions[nickname] = mentions[nickname].filter((m) => m !== mention);
                    pingedMessagesofChatters = pingedMessagesofChatters.filter((m) => m !== mention);
                    GM_setValue(PINGED_STORAGE_KEY, JSON.stringify(pingedMessagesofChatters));

                    if (mentions[nickname].length === 0) {
                        delete mentions[nickname];
                        delete expandedState[nickname];
                    }
                    updateMentionList();
                });

                messageText.appendChild(deleteButton);
                messagesContainer.appendChild(messageText);
            });

            mentionItem.appendChild(messagesContainer);
            mentionList.appendChild(mentionItem);
        });
    };

    // Наблюдение за новыми сообщениями в чате
    const observeChat = () => {
        console.log('Наблюдение за чатом...');

        const chatContainer = document.querySelector('.chat-scrollable-area__message-container');
        if (!chatContainer) {
            console.error('Не найден контейнер чата.');
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const messageText = node.innerText;
                        if (messageText && messageText.includes(TARGET_NICKNAME)) {
                            const nickname = node.querySelector('.chat-author__display-name')?.textContent || 'Неизвестный';
                            handleMention(nickname, messageText, node);

                            const popup = document.createElement('div');
                            popup.textContent = `${nickname} упомянул вас в чате!`;
                            popup.style.position = 'fixed';
                            popup.style.top = '85%';
                            popup.style.left = '65%';
                            popup.style.transform = 'translateX(-50%)';
                            popup.style.backgroundColor = '#4c2a5e';
                            popup.style.color = '#fff';
                            popup.style.padding = '10px';
                            popup.style.borderRadius = '5px';
                            popup.style.zIndex = '9999';
                            document.body.appendChild(popup);

                            setTimeout(() => {
                                popup.remove();
                            }, 3000);
                        }
                    }
                });
            });
        });

        observer.observe(chatContainer, { childList: true, subtree: true });

        // Периодическая проверка чата каждые 2 секунды
        setInterval(() => {
            console.log('Периодическая проверка чата...');
            const messages = chatContainer.querySelectorAll('.chat-line__message');
            messages.forEach((messageNode) => {
                const messageText = messageNode.innerText;
                if (messageText && messageText.includes(TARGET_NICKNAME)) {
                    const nickname = messageNode.querySelector('.chat-author__display-name')?.textContent || 'Неизвестный';
                    if (!mentions[nickname] || !mentions[nickname].some(m => m.message === messageText)) {
                        handleMention(nickname, messageText, messageNode);
                    }
                }
            });
        }, 2000);
    };

    // Отдельный MutationObserver для счетчика
    const observeMentionCount = () => {
        console.log('Наблюдение за счетчиком упоминаний...');

        const mentionBubbleObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'textContent') {
                    console.log('Счетчик упоминаний изменился:', mentionBubble.textContent);
                    mentionCount = parseInt(mentionBubble.textContent) || 0;
                }
            });
        });

        mentionBubbleObserver.observe(mentionBubble, {
            attributes: true, // Отслеживаем изменения атрибутов
        });

        // Периодическая проверка счетчика каждые 2 секунды
        setInterval(() => {
            console.log('Периодическая проверка счетчика...');
            mentionBubble.textContent = mentionCount > 0 ? mentionCount : '0';
        }, 2000);
    };

    // Обработчик клика на кнопку упоминаний
    mentionBubble.addEventListener('click', () => {
        console.log('Клик по кнопке упоминаний...');
        if (mentionList.style.display === 'none') {
            mentionList.style.display = 'block';
            setTimeout(() => {
                mentionList.style.opacity = '1';
                mentionList.style.transform = 'translateY(0)';
            }, 10);
        } else {
            mentionList.style.opacity = '0';
            mentionList.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                mentionList.style.display = 'none';
            }, 300);
        }
    });

    // Обработчик клика вне панели
    document.addEventListener('click', (event) => {
        const isClickInsideMentionList = mentionList.contains(event.target);
        const isClickInsideMentionBubble = mentionBubble.contains(event.target);

        if (!isClickInsideMentionList && !isClickInsideMentionBubble) {
            console.log('Клик вне панели упоминаний...');
            mentionList.style.opacity = '0';
            mentionList.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                mentionList.style.display = 'none';
            }, 300);
        }
    });

    // Остановка распространения события внутри панели
    mentionList.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Инициализация скрипта
    const initialize = () => {
        console.log('Инициализация скрипта...');
        pingedMessagesofChatters.forEach((mention) => {
            if (!mentions[mention.nickname]) {
                mentions[mention.nickname] = [];
            }
            mentions[mention.nickname].push(mention);
            mentionCount++;
        });

        updateMentionBubble();
        updateMentionList();
        observeChat();
        observeMentionCount(); // Инициализация отдельного наблюдателя для счетчика
    };

    window.addEventListener('load', initialize);
})();