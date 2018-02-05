window.onload = function() {
    const db = firebase.database();

    const whoAmI = document.getElementById("whoAmI");
    const chatWindow = document.getElementById("chatWindow");
    const messageBox = document.getElementById("messageBox");
    const messages = document.getElementById("messages");
    let currentUser;

    if(JSON.parse(localStorage.getItem("user"))) {
        currentUser = JSON.parse(localStorage.getItem("user")).name;
    }

    if(currentUser)
        login();

    function login() {
        document.getElementById("currentUser").innerText = currentUser;

        whoAmI.classList.add("hidden");
        chatWindow.classList.remove("hidden");
        messages.classList.remove("hidden");
    }

    function createMessageBox(msgId, fromUser, msg, sentAt) {
        let li = document.createElement("li");
        li.classList.add("message");
        let from = document.createElement("p"),
            messageText = document.createElement("p"),
            messageInfo = document.createElement("div"),
            sentTime = document.createElement("p"),
            sent = document.createElement("span"),
            upvotes = document.createElement("a"),
            downvotes = document.createElement("a");

        from.classList.add("from");
        messageText.classList.add("messageText");
        messageInfo.classList.add("messageInfo");
        sentTime.classList.add("sentTime");
        sent.classList.add("sent");
        upvotes.classList.add("upvotes");
        downvotes.classList.add("downvotes");

        upvotes.href = "#";
        downvotes.href = "#";

        from.innerText = fromUser;
        messageText.innerText = msg;
        sent.innerText = sentAt;

        li.appendChild(from);
        li.appendChild(messageText);
        sentTime.innerText = "Sent at ";
        sentTime.appendChild(sent);

        let upvoteCount,
            downvoteCount;

        db.ref("likes/" + msgId).on("value", function(snapshot) {
            let data = snapshot.val();

            for(let votes in data) {
                if(votes == "downvotes") {
                    downvoteCount = data[votes];
                    downvotes.innerText = "-" + data[votes];
                }
                else if(votes == "upvotes") {
                    upvoteCount = data[votes];
                    upvotes.innerText = "+" + data[votes];
                }
            }
        });

        upvotes.addEventListener("click", function() {
            let likes = upvoteCount+1;
            let votes = {
                downvotes: downvoteCount,
                upvotes: likes
            }

            let user = JSON.parse(localStorage.getItem("user")).name;
            let likeData = {
                vote: "+1",
                user: user,
                msgId: msgId
            }

            db.ref("userLikes/").push(likeData);

            db.ref("likes/" + msgId).set(votes);
            upvotes.innerText = "+" + likes;
        });

        downvotes.addEventListener("click", function() {
            let dislikes = downvoteCount+1;
            let votes = {
                downvotes: dislikes,
                upvotes: upvoteCount
            }

            let user = JSON.parse(localStorage.getItem("user")).name;
            let likeData = {
                vote: "-1",
                user: user,
                msgId: msgId
            }

            db.ref("userLikes/").push(likeData);

            db.ref("likes/" + msgId).set(votes);
            downvotes.innerText = "-" + dislikes;

        });

        messageInfo.appendChild(sentTime);
        messageInfo.appendChild(upvotes);
        messageInfo.appendChild(downvotes);

        li.appendChild(messageInfo);
        messages.insertBefore(li, messages.childNodes[0]);
    }

    whoAmI.addEventListener("submit", function(event) {
        event.preventDefault();
        currentUser = document.getElementById("user").value;
        let userData = {
            name: currentUser
        }

        let dataString = JSON.stringify(userData);
        localStorage.setItem("user", dataString);

        login();
    });

    document.getElementById("forgetName").addEventListener("click", function() {
        localStorage.removeItem("user");
        currentUser = undefined;

        whoAmI.classList.remove("hidden");
        chatWindow.classList.add("hidden");
        messages.classList.add("hidden");
    });

    messageBox.addEventListener("submit", function() {
        if(textBox.value.length > 0) {
            let messageId;
            let date = new Date();
            let time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

            let message = {
                message: textBox.value,
                name: currentUser,
                sent: time
            }

            textBox.value = "";
            db.ref("messages/").push(message);

            db.ref("messages/").once("value", function(snapshot) {
                let data = snapshot.val();

                for(let message in data) {
                    messageId = message;
                }
            });

            let votes = {
                upvotes: 0,
                downvotes: 0
            }
            db.ref("likes/" + messageId).set(votes);
        }
    });

    db.ref("messages/").on("child_added", function(snapshot, prevChildKey) {
        let data = snapshot.val();
        let key = snapshot.key;

        createMessageBox(key, data.name, data.message, data.sent);
    });
}
