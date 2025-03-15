// importing the required modules
let jwt = require("jsonwebtoken");
require("dotenv").config();
// defining the utils class
class Utils {
          constructor() {
                    // this.gc = {}

                    this.mail = {
                              welcome: {
                                        subject: "Welcome to Fluxel!",
                                        body: `<p>Dear {{name}},</p>
                <p>Thank you for joining Fluxel! We are thrilled to have you as part of our community.</p>
                <p>With Fluxel, you are now part of a pioneering platform designed to make your experience in the world of peer-to-peer cryptocurrency transactions seamless and secure. Here’s what you can expect:</p>
                <p>1. Easy Navigation: Our user-friendly interface ensures you can manage your transactions effortlessly.</p>
                 <p>2. Secure Transactions: We prioritize your security, employing advanced technologies to safeguard your assets.</p>
                  <p>3. Diverse Features: Explore various functionalities tailored to enhance your cryptocurrency experience, including gift card buying and selling.</p>
                   <p>To get started, we encourage you to log in to your account and explore the features available to you.</p>

                <p> Login Here: <a href="${process.env.WEB_BASE_URL}">click here to login to your account</a></p>
                
                <p>If you have any issues or need assistance, please do not hesitate to contact our support team.</p>
                <p>Best regards,</p>
                <p>Fluxel Team</p>`,
                              },
                              complaint: {
                                        subject: "Complaint Received - We’re Here to Help",
                                        body: `
                <p>Dear {{name}},</p>
                <p>Thank you for reaching out to us with your concerns. We have received your report and want to assure you that your complaint is being reviewed by our support team.</p> 
                <br/>
                <p>At Fluxel, we prioritize providing top-notch service, and we are committed to resolving your issue as quickly as possible. Here’s what you can expect from us:</p>
                <br/>
                <p>1. Timely Response: Our team is working diligently to address your concern, and you will hear back from us within 24-48 hours.</p>
                <br/>
                <p>2. Dedicated Support: We take all feedback seriously and will work closely with you to ensure your issue is resolved to your satisfaction.</p>
                <br/>
                <p>If you have any further information or documentation to support your report, please don’t hesitate to share it with us by replying to this email.</p>
                <br/>
                <p>Thank you for your patience and trust in Fluxel.</p>
                <br/>
                <p>Best regards,</p>
                <br/>
                <p>Fluxel Support Team</p>
                <br/>
                `
                              }

                    };
          }
}


module.exports = {
          Utils,
};