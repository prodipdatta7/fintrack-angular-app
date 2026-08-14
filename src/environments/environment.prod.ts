export const environment = {
    production: true,
    /**
     * Direct API URL to the deployed Cloud Run backend
     */
    apiUrl: 'https://fintrack-api-557447503156.us-central1.run.app/api',
    /**
     * Firebase Authentication config (public values — safe to commit).
     * TODO: replace the placeholders below with the values from
     * Firebase Console → Project settings → Your apps → Web app.
     */
    firebase: {
        apiKey: "AIzaSyDP4nNtPVRTgv9O4E33zeORtWX8yb7p5Ss",
        authDomain: "fintrack-729df.firebaseapp.com",
        projectId: "fintrack-729df",
        storageBucket: "fintrack-729df.firebasestorage.app",
        messagingSenderId: "20375162593",
        appId: "1:20375162593:web:06fd318dd5c4b0393871a0",
        measurementId: "G-DZ1XERG422"
    },
    adminEmails: [
        'admin@fintrack.app',
        'prodipdatta7@gmail.com',
        'prodippradhan@gmail.com',
    ],
};
