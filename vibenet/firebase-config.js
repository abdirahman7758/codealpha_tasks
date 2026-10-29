// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdAspXLWDzQ6w3Kvgatc2QpZqbd1ml8hQ",
  authDomain: "vibenet1.firebaseapp.com",
  projectId: "vibenet1",
  storageBucket: "vibenet1.firebasestorage.app",
  messagingSenderId: "725477594318",
  appId: "1:725477594318:web:f2344978eb800778c46c9f",
  measurementId: "G-8ZEBS2RVJS",
};

// Check if credentials have been provided by developer
export const isLiveFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID",
);

// Unified State and Backend Service Interface
let authService = null;
let dbService = null;

if (isLiveFirebaseConfigured) {
  try {
    const { initializeApp } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const {
      getAuth,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      onAuthStateChanged,
      updateProfile,
    } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const {
      getFirestore,
      collection,
      doc,
      setDoc,
      getDoc,
      getDocs,
      addDoc,
      deleteDoc,
      updateDoc,
      query,
      orderBy,
      onSnapshot,
      serverTimestamp,
      arrayUnion,
      arrayRemove,
    } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    authService = {
      isLive: true,
      currentUser: () => auth.currentUser,
      onAuthStateChanged: (cb) => onAuthStateChanged(auth, cb),
      signIn: (email, password) =>
        signInWithEmailAndPassword(auth, email, password),
      signUp: async (email, password, displayName) => {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        if (displayName) {
          await updateProfile(userCred.user, { displayName });
        }
        return userCred;
      },
      signOut: () => signOut(auth),
    };

    dbService = {
      isLive: true,
      // Listen to posts in real-time
      listenToPosts: (callback) => {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        return onSnapshot(
          q,
          (snapshot) => {
            const posts = [];
            snapshot.forEach((docSnap) => {
              posts.push({ id: docSnap.id, ...docSnap.data() });
            });
            callback(posts);
          },
          (error) => {
            console.error("Firestore feed snapshot error:", error);
          },
        );
      },
      // Create new post
      createPost: async (postData) => {
        const postsRef = collection(db, "posts");
        return await addDoc(postsRef, {
          ...postData,
          likes: [],
          comments: [],
          createdAt: serverTimestamp(),
        });
      },
      // Delete post
      deletePost: async (postId) => {
        const postRef = doc(db, "posts", postId);
        return await deleteDoc(postRef);
      },
      // Toggle like on post
      toggleLike: async (postId, userId, currentlyLiked) => {
        const postRef = doc(db, "posts", postId);
        return await updateDoc(postRef, {
          likes: currentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
        });
      },
      // Add comment to post
      addComment: async (postId, comment) => {
        const postRef = doc(db, "posts", postId);
        return await updateDoc(postRef, {
          comments: arrayUnion(comment),
        });
      },
      // Get or create user profile document
      getUserProfile: async (userId) => {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        return snap.exists() ? snap.data() : null;
      },
      setUserProfile: async (userId, data) => {
        const userRef = doc(db, "users", userId);
        return await setDoc(userRef, data, { merge: true });
      },
      // Toggle follow/unfollow between current user and target user
      toggleFollow: async (
        currentUserId,
        targetUserId,
        isCurrentlyFollowing,
      ) => {
        const currentUserRef = doc(db, "users", currentUserId);
        const targetUserRef = doc(db, "users", targetUserId);

        const followingUpdate = isCurrentlyFollowing
          ? arrayRemove(targetUserId)
          : arrayUnion(targetUserId);
        const followersUpdate = isCurrentlyFollowing
          ? arrayRemove(currentUserId)
          : arrayUnion(currentUserId);

        await updateDoc(currentUserRef, { following: followingUpdate });
        await updateDoc(targetUserRef, { followers: followersUpdate });
      },
      // Fetch all member profiles for suggestion sidebar
      getAllUsers: async () => {
        const usersRef = collection(db, "users");
        const snap = await getDocs(usersRef);
        const users = [];
        snap.forEach((docSnap) =>
          users.push({ id: docSnap.id, ...docSnap.data() }),
        );
        return users;
      },
    };
  } catch (err) {
    console.warn(
      "Could not initialize live Firebase SDK. Falling back to local storage adapter.",
      err,
    );
  }
}

// Robust LocalStorage BaaS Adapter (Used if Firebase credentials are blank or when running offline)
if (!authService || !dbService) {
  const STORAGE_KEY_AUTH = "vibenet_mock_auth_user";
  const STORAGE_KEY_POSTS = "vibenet_mock_posts";
  const STORAGE_KEY_USERS = "vibenet_mock_users";

  // Initial Seed Data for immediate realistic preview
  const defaultUsers = [
    {
      id: "usr_marcus",
      uid: "usr_marcus",
      displayName: "Marcus Vance",
      handle: "@marcusv",
      email: "marcus@vibenet.local",
      bio: "Systems architect and distributed systems enthusiast. Building the modern web.",
      joinedAt: "September 2026",
      followers: ["usr_clara"],
      following: ["usr_devon"],
    },
    {
      id: "usr_clara",
      uid: "usr_clara",
      displayName: "Clara Hughes",
      handle: "@clarah",
      email: "clara@vibenet.local",
      bio: "Product designer passionate about clean interfaces, typography, and accessibility.",
      joinedAt: "August 2026",
      followers: ["usr_marcus", "usr_devon"],
      following: ["usr_marcus"],
    },
    {
      id: "usr_devon",
      uid: "usr_devon",
      displayName: "Devon Reed",
      handle: "@devonreed",
      email: "devon@vibenet.local",
      bio: "Database administrator and cloud infrastructure engineer.",
      joinedAt: "October 2026",
      followers: [],
      following: ["usr_clara"],
    },
  ];

  const defaultPosts = [
    {
      id: "post_1",
      authorId: "usr_clara",
      authorName: "Clara Hughes",
      authorHandle: "@clarah",
      content:
        "Clean, responsive typography and deliberate spacing make all the difference in modern web applications. No fluff, just pure functionality.",
      likes: ["usr_marcus"],
      comments: [
        {
          id: "cmt_1",
          authorId: "usr_marcus",
          authorName: "Marcus Vance",
          content:
            "Completely agreed. Solid contrast and predictable hierarchy always win.",
          createdAtIso: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      createdAtIso: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "post_2",
      authorId: "usr_marcus",
      authorName: "Marcus Vance",
      authorHandle: "@marcusv",
      content:
        "Welcome to VibeNet! Real-time state synchronizations, fast interactions, and zero algorithmic interference. Feel free to publish your first post.",
      likes: ["usr_clara", "usr_devon"],
      comments: [],
      createdAtIso: new Date(Date.now() - 14400000).toISOString(),
    },
  ];

  if (!localStorage.getItem(STORAGE_KEY_USERS)) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(STORAGE_KEY_POSTS)) {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(defaultPosts));
  }

  const authSubscribers = [];
  const postSubscribers = [];

  function broadcastPosts() {
    const raw = localStorage.getItem(STORAGE_KEY_POSTS);
    const posts = raw ? JSON.parse(raw) : [];
    postSubscribers.forEach((cb) => cb(posts));
  }

  function broadcastAuth(user) {
    authSubscribers.forEach((cb) => cb(user));
  }

  // Cross-tab synchronization via storage event
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY_POSTS) {
      broadcastPosts();
    }
  });

  authService = {
    isLive: false,
    currentUser: () => {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      return raw ? JSON.parse(raw) : null;
    },
    onAuthStateChanged: (cb) => {
      authSubscribers.push(cb);
      const user = authService.currentUser();
      cb(user);
      return () => {
        const idx = authSubscribers.indexOf(cb);
        if (idx !== -1) authSubscribers.splice(idx, 1);
      };
    },
    signIn: async (email, password) => {
      const usersRaw = localStorage.getItem(STORAGE_KEY_USERS);
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      let found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );

      if (!found) {
        // Auto-create local user if signing in
        const namePart = email.split("@")[0];
        found = {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          uid: "usr_" + Math.random().toString(36).substring(2, 9),
          displayName: namePart.charAt(0).toUpperCase() + namePart.slice(1),
          handle: "@" + namePart.toLowerCase().replace(/[^a-z0-9]/g, ""),
          email: email,
          bio: "Joined VibeNet network member.",
          joinedAt: "October 2026",
          followers: [],
          following: [],
        };
        users.push(found);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      }

      const sessionUser = {
        uid: found.id || found.uid,
        email: found.email,
        displayName: found.displayName,
      };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(sessionUser));
      broadcastAuth(sessionUser);
      return { user: sessionUser };
    },
    signUp: async (email, password, displayName) => {
      const usersRaw = localStorage.getItem(STORAGE_KEY_USERS);
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const cleanName = displayName || email.split("@")[0];
      const newUser = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        uid: "usr_" + Math.random().toString(36).substring(2, 9),
        displayName: cleanName,
        handle: "@" + cleanName.toLowerCase().replace(/[^a-z0-9]/g, ""),
        email: email,
        bio: "Joined VibeNet network member.",
        joinedAt: "October 2026",
        followers: [],
        following: [],
      };
      users.push(newUser);
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

      const sessionUser = {
        uid: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
      };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(sessionUser));
      broadcastAuth(sessionUser);
      return { user: sessionUser };
    },
    signOut: async () => {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      broadcastAuth(null);
    },
  };

  dbService = {
    isLive: false,
    listenToPosts: (callback) => {
      postSubscribers.push(callback);
      const raw = localStorage.getItem(STORAGE_KEY_POSTS);
      const posts = raw ? JSON.parse(raw) : [];
      callback(posts);
      return () => {
        const idx = postSubscribers.indexOf(callback);
        if (idx !== -1) postSubscribers.splice(idx, 1);
      };
    },
    createPost: async (postData) => {
      const raw = localStorage.getItem(STORAGE_KEY_POSTS);
      const posts = raw ? JSON.parse(raw) : [];
      const newPost = {
        id:
          "post_" +
          Date.now().toString(36) +
          Math.random().toString(36).substring(2, 5),
        ...postData,
        likes: [],
        comments: [],
        createdAtIso: new Date().toISOString(),
      };
      posts.unshift(newPost);
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
      broadcastPosts();
      return newPost;
    },
    deletePost: async (postId) => {
      const raw = localStorage.getItem(STORAGE_KEY_POSTS);
      let posts = raw ? JSON.parse(raw) : [];
      posts = posts.filter((p) => p.id !== postId);
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
      broadcastPosts();
    },
    toggleLike: async (postId, userId, currentlyLiked) => {
      const raw = localStorage.getItem(STORAGE_KEY_POSTS);
      const posts = raw ? JSON.parse(raw) : [];
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      if (!post.likes) post.likes = [];

      if (currentlyLiked) {
        post.likes = post.likes.filter((uid) => uid !== userId);
      } else {
        if (!post.likes.includes(userId)) {
          post.likes.push(userId);
        }
      }
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
      broadcastPosts();
    },
    addComment: async (postId, comment) => {
      const raw = localStorage.getItem(STORAGE_KEY_POSTS);
      const posts = raw ? JSON.parse(raw) : [];
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      if (!post.comments) post.comments = [];
      post.comments.push(comment);
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
      broadcastPosts();
    },
    getUserProfile: async (userId) => {
      const usersRaw = localStorage.getItem(STORAGE_KEY_USERS);
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      return users.find((u) => u.id === userId || u.uid === userId) || null;
    },
    setUserProfile: async (userId, data) => {
      const usersRaw = localStorage.getItem(STORAGE_KEY_USERS);
      let users = usersRaw ? JSON.parse(usersRaw) : [];
      const index = users.findIndex((u) => u.id === userId || u.uid === userId);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
      } else {
        users.push({ id: userId, uid: userId, ...data });
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      return users[index];
    },
    toggleFollow: async (currentUserId, targetUserId, isCurrentlyFollowing) => {
      const usersRaw = localStorage.getItem(STORAGE_KEY_USERS);
      const users = usersRaw ? JSON.parse(usersRaw) : [];

      const currentUser = users.find(
        (u) => u.id === currentUserId || u.uid === currentUserId,
      );
      const targetUser = users.find(
        (u) => u.id === targetUserId || u.uid === targetUserId,
      );

      if (currentUser && targetUser) {
        if (!currentUser.following) currentUser.following = [];
        if (!targetUser.followers) targetUser.followers = [];

        if (isCurrentlyFollowing) {
          currentUser.following = currentUser.following.filter(
            (id) => id !== targetUserId,
          );
          targetUser.followers = targetUser.followers.filter(
            (id) => id !== currentUserId,
          );
        } else {
          if (!currentUser.following.includes(targetUserId))
            currentUser.following.push(targetUserId);
          if (!targetUser.followers.includes(currentUserId))
            targetUser.followers.push(currentUserId);
        }
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      }
    },
    getAllUsers: async () => {
      const usersRaw = localStorage.getItem(STORAGE_KEY_USERS);
      return usersRaw ? JSON.parse(usersRaw) : [];
    },
  };
}

export { authService, dbService };
