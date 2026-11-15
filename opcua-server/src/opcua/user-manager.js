"use strict";
const crypto = require("crypto");

// timingSafeEqual needs equal lengths. A hash always has the same lenhth
function sha256(text) {
    return crypto.createHash("sha256").update(text).digest();
}

function createUserManager(user, password) {
    const expectedUser = sha256(user);
    const expectedPassword = sha256(password);
    return {
        // === stops at the first wrong letter. The time could give the password away
        isValidUser(userName, userPassword) {
            const userOk = crypto.timingSafeEqual(sha256(userName), expectedUser);
            const passwordOk = crypto.timingSafeEqual(sha256(userPassword), expectedPassword);
            return userOk && passwordOk;
        },
    };
}

module.exports = { createUserManager };
