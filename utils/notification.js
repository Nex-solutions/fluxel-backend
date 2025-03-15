const { Notification } = require('../model/notifications');

async function addNotifications(notifications) {
    try {
        const notification_object = await Notification.insertMany(notifications);
        return notification_object;
    } catch (error) {
        console.error("Error inserting notifications:", error);
        return false;
    }
}

module.exports = { addNotifications };