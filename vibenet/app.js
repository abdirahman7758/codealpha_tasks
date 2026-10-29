/**
 * VibeNet - Main Application Controller
 * Handles Authentication, Real-Time Feed, Comments, Likes, Profiles, and Navigation.
 * Adheres strictly to clean UI/UX standards: no purple gradients, no pill buttons, no emojis, no em dashes.
 */

import { authService, dbService, isLiveFirebaseConfigured } from "./firebase-config.js";

// State Management
const state = {
  currentUser: null,
  userProfile: null,
  posts: [],
  activeFilter: "all", // "all" | "following"
  searchQuery: "",
  viewingUserId: null, // null means viewing own profile when on profile tab
  activeView: "feed", // "feed" | "profile"
  postToDeleteId: null,
  openCommentPostIds: new Set()
};

// DOM Elements
const elements = {
  // Navigation & Auth
  navBrandLogo: document.getElementById("navBrandLogo"),
  unauthNavActions: document.getElementById("unauthNavActions"),
  authNavActions: document.getElementById("authNavActions"),
  openSignInBtn: document.getElementById("openSignInBtn"),
  openSignUpBtn: document.getElementById("openSignUpBtn"),
  userMenuToggleBtn: document.getElementById("userMenuToggleBtn"),
  userDropdownMenu: document.getElementById("userDropdownMenu"),
  headerUserAvatar: document.getElementById("headerUserAvatar"),
  headerUserName: document.getElementById("headerUserName"),
  dropdownUserName: document.getElementById("dropdownUserName"),
  dropdownUserEmail: document.getElementById("dropdownUserEmail"),
  navViewProfileBtn: document.getElementById("navViewProfileBtn"),
  navEditProfileBtn: document.getElementById("navEditProfileBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  globalSearchInput: document.getElementById("globalSearchInput"),

  // Banners & Sidebars
  systemBanner: document.getElementById("systemBanner"),
  sidebarFeedBtn: document.getElementById("sidebarFeedBtn"),
  sidebarProfileBtn: document.getElementById("sidebarProfileBtn"),
  navHomeItem: document.getElementById("navHomeItem"),
  navProfileItem: document.getElementById("navProfileItem"),
  userQuickCard: document.getElementById("userQuickCard"),
  quickCardAvatar: document.getElementById("quickCardAvatar"),
  quickCardName: document.getElementById("quickCardName"),
  quickCardHandle: document.getElementById("quickCardHandle"),
  quickCardPostsCount: document.getElementById("quickCardPostsCount"),
  quickCardFollowersCount: document.getElementById("quickCardFollowersCount"),
  quickCardFollowingCount: document.getElementById("quickCardFollowingCount"),
  suggestedUsersList: document.getElementById("suggestedUsersList"),

  // Feed & Composer
  mainFeedView: document.getElementById("mainFeedView"),
  composerSection: document.getElementById("composerSection"),
  composerAvatar: document.getElementById("composerAvatar"),
  createPostForm: document.getElementById("createPostForm"),
  postTextInput: document.getElementById("postTextInput"),
  charCounter: document.getElementById("charCounter"),
  publishPostBtn: document.getElementById("publishPostBtn"),
  feedStream: document.getElementById("feedStream"),
  tabAllPosts: document.getElementById("tabAllPosts"),
  tabFollowingPosts: document.getElementById("tabFollowingPosts"),

  // Profile View
  profilePageView: document.getElementById("profilePageView"),
  profilePageAvatar: document.getElementById("profilePageAvatar"),
  profilePageName: document.getElementById("profilePageName"),
  profilePageHandle: document.getElementById("profilePageHandle"),
  profilePageBio: document.getElementById("profilePageBio"),
  profilePageJoined: document.getElementById("profilePageJoined"),
  profilePagePostsCount: document.getElementById("profilePagePostsCount"),
  profilePageFollowersCount: document.getElementById("profilePageFollowersCount"),
  profilePageFollowingCount: document.getElementById("profilePageFollowingCount"),
  profileEditBtn: document.getElementById("profileEditBtn"),
  profileFollowBtn: document.getElementById("profileFollowBtn"),
  profilePostsStream: document.getElementById("profilePostsStream"),

  // Modals
  authModal: document.getElementById("authModal"),
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
  tabSignIn: document.getElementById("tabSignIn"),
  tabSignUp: document.getElementById("tabSignUp"),
  authTitle: document.getElementById("authModalTitle"),
  authForm: document.getElementById("authForm"),
  displayNameGroup: document.getElementById("displayNameGroup"),
  authDisplayName: document.getElementById("authDisplayName"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authSubmitBtn: document.getElementById("authSubmitBtn"),
  authErrorMessage: document.getElementById("authErrorMessage"),
  demoAccountBtn: document.getElementById("demoAccountBtn"),

  editProfileModal: document.getElementById("editProfileModal"),
  closeEditProfileBtn: document.getElementById("closeEditProfileBtn"),
  cancelEditProfileBtn: document.getElementById("cancelEditProfileBtn"),
  editProfileForm: document.getElementById("editProfileForm"),
  editDisplayName: document.getElementById("editDisplayName"),
  editBio: document.getElementById("editBio"),

  deleteConfirmModal: document.getElementById("deleteConfirmModal"),
  closeDeleteModalBtn: document.getElementById("closeDeleteModalBtn"),
  cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),

  // Toast Container
  toastContainer: document.getElementById("toastContainer")
};

// Utilities
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getInitials(name) {
  if (!name) return "VN";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return "Just now";
  let date;
  if (typeof dateInput === "object" && dateInput.toDate) {
    date = dateInput.toDate(); // Firestore Timestamp
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    date = new Date(dateInput);
  }

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Toast Feedback Notification (Emerald Green Accent)
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "toast-error" : ""}`;

  const iconSvg = isError
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "all 0.2s ease";
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Initialize Application
async function initApp() {
  setupEventListeners();

  // Show status banner if operating under local demo storage
  if (!isLiveFirebaseConfigured) {
    elements.systemBanner.style.display = "block";
  }

  // Subscribe to Auth State
  authService.onAuthStateChanged(async (user) => {
    state.currentUser = user;
    if (user) {
      await loadCurrentUserProfile(user);
      renderAuthNav(true);
    } else {
      state.userProfile = null;
      renderAuthNav(false);
    }
    updateSuggestedMembers();
    renderFeed();
  });

  // Subscribe to Real-Time Posts Feed (onSnapshot)
  dbService.listenToPosts((posts) => {
    state.posts = posts || [];
    renderFeed();
    if (state.activeView === "profile") {
      renderProfilePosts();
    }
    updateQuickCardStats();
  });
}

// Load Current User Profile
async function loadCurrentUserProfile(user) {
  const userId = user.uid || user.id;
  let profile = await dbService.getUserProfile(userId);

  if (!profile) {
    profile = {
      id: userId,
      uid: userId,
      displayName: user.displayName || user.email.split("@")[0],
      handle: "@" + (user.displayName || user.email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, ""),
      email: user.email,
      bio: "Member of the VibeNet network.",
      joinedAt: "October 2026",
      followers: [],
      following: []
    };
    await dbService.setUserProfile(userId, profile);
  }

  state.userProfile = profile;
  updateQuickCard(profile);
}

// Navigation & Auth Rendering
function renderAuthNav(isAuthenticated) {
  if (isAuthenticated && state.userProfile) {
    elements.unauthNavActions.style.display = "none";
    elements.authNavActions.style.display = "flex";
    elements.userQuickCard.style.display = "block";

    const initials = getInitials(state.userProfile.displayName);
    elements.headerUserAvatar.textContent = initials;
    elements.headerUserName.textContent = state.userProfile.displayName;
    elements.dropdownUserName.textContent = state.userProfile.displayName;
    elements.dropdownUserEmail.textContent = state.userProfile.email || "";

    elements.composerAvatar.textContent = initials;
  } else {
    elements.unauthNavActions.style.display = "flex";
    elements.authNavActions.style.display = "none";
    elements.userQuickCard.style.display = "none";
    elements.composerAvatar.textContent = "VN";
  }
}

// Update Left Quick Card
function updateQuickCard(profile) {
  if (!profile) return;
  elements.quickCardAvatar.textContent = getInitials(profile.displayName);
  elements.quickCardName.textContent = profile.displayName;
  elements.quickCardHandle.textContent = profile.handle || "@member";
  updateQuickCardStats();
}

function updateQuickCardStats() {
  if (!state.userProfile) return;
  const currentUid = state.currentUser ? (state.currentUser.uid || state.currentUser.id) : null;
  const userPostsCount = state.posts.filter((p) => p.authorId === currentUid).length;

  elements.quickCardPostsCount.textContent = userPostsCount;
  elements.quickCardFollowersCount.textContent = (state.userProfile.followers || []).length;
  elements.quickCardFollowingCount.textContent = (state.userProfile.following || []).length;
}

// Feed Rendering
function renderFeed() {
  let filtered = [...state.posts];

  // 1. Tab Filtering (All vs Following)
  if (state.activeFilter === "following" && state.userProfile) {
    const following = state.userProfile.following || [];
    const currentUid = state.currentUser ? (state.currentUser.uid || state.currentUser.id) : null;
    filtered = filtered.filter((p) => following.includes(p.authorId) || p.authorId === currentUid);
  }

  // 2. Search Query Filtering
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    filtered = filtered.filter((p) => 
      (p.content && p.content.toLowerCase().includes(q)) ||
      (p.authorName && p.authorName.toLowerCase().includes(q)) ||
      (p.authorHandle && p.authorHandle.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    elements.feedStream.innerHTML = `
      <div class="empty-state">
        <h4 class="empty-state-title">No posts found</h4>
        <p>${state.activeFilter === "following" ? "You are not following anyone with posts yet. Explore All Posts or follow members on the right." : "Be the first to publish a post and get the conversation started."}</p>
      </div>
    `;
    return;
  }

  elements.feedStream.innerHTML = filtered.map((post) => createPostCardMarkup(post)).join("");
}

// Generate Post Card HTML Markup
function createPostCardMarkup(post) {
  const currentUid = state.currentUser ? (state.currentUser.uid || state.currentUser.id) : null;
  const isAuthor = currentUid && post.authorId === currentUid;
  const isLiked = Array.isArray(post.likes) && currentUid && post.likes.includes(currentUid);
  const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
  const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
  const timeFormatted = formatRelativeTime(post.createdAt || post.createdAtIso);
  const isCommentsOpen = state.openCommentPostIds.has(post.id);

  return `
    <article class="post-card" id="post-${escapeHtml(post.id)}">
      <header class="post-header">
        <div class="author-meta" data-user-id="${escapeHtml(post.authorId)}">
          <div class="avatar avatar-sm">${escapeHtml(getInitials(post.authorName))}</div>
          <div class="author-info">
            <span class="author-name">${escapeHtml(post.authorName || "Member")}</span>
            <span class="author-handle-time">
              <span>${escapeHtml(post.authorHandle || "@member")}</span>
              <span class="post-dot-divider"></span>
              <time>${timeFormatted}</time>
            </span>
          </div>
        </div>
        ${isAuthor ? `
          <button class="btn-icon btn-delete-post" data-action="delete-post" data-post-id="${escapeHtml(post.id)}" title="Delete post" aria-label="Delete post">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        ` : ""}
      </header>

      <div class="post-body">${escapeHtml(post.content)}</div>

      <div class="post-actions">
        <!-- Like Button -->
        <button class="action-btn ${isLiked ? "liked" : ""}" data-action="toggle-like" data-post-id="${escapeHtml(post.id)}" data-liked="${isLiked}">
          <svg viewBox="0 0 24 24" fill="${isLiked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>${likeCount}</span>
        </button>

        <!-- Comment Button -->
        <button class="action-btn" data-action="toggle-comments" data-post-id="${escapeHtml(post.id)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span>${commentCount}</span>
        </button>

        <!-- Share Button -->
        <button class="action-btn" data-action="share-post" data-post-id="${escapeHtml(post.id)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span>Share</span>
        </button>
      </div>

      <!-- Collapsible Comments Section -->
      <div class="comments-container ${isCommentsOpen ? "open" : ""}" id="comments-${escapeHtml(post.id)}">
        <form class="comment-composer" data-post-id="${escapeHtml(post.id)}">
          <input type="text" class="comment-input" placeholder="Write a comment..." required maxlength="200">
          <button type="submit" class="btn-primary" style="padding: 0.4rem 0.85rem; font-size: 0.8125rem;">Reply</button>
        </form>

        <div class="comments-list">
          ${Array.isArray(post.comments) && post.comments.length > 0 ? post.comments.map((c) => `
            <div class="comment-item">
              <div class="avatar avatar-sm">${escapeHtml(getInitials(c.authorName))}</div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">${escapeHtml(c.authorName || "Member")}</span>
                  <span class="comment-time">${formatRelativeTime(c.createdAt || c.createdAtIso)}</span>
                </div>
                <div class="comment-text">${escapeHtml(c.content)}</div>
              </div>
            </div>
          `).join("") : `<div style="font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 0.5rem 0;">No comments yet. Start the conversation.</div>`}
        </div>
      </div>
    </article>
  `;
}

// Profile Page Display
async function showProfileView(targetUserId = null) {
  const currentUid = state.currentUser ? (state.currentUser.uid || state.currentUser.id) : null;
  const userIdToLoad = targetUserId || currentUid;

  if (!userIdToLoad) {
    openAuthModal("signin");
    return;
  }

  state.viewingUserId = userIdToLoad;
  state.activeView = "profile";

  elements.mainFeedView.style.display = "none";
  elements.profilePageView.classList.add("active");
  elements.navHomeItem.classList.remove("active");
  elements.navProfileItem.classList.add("active");

  const profile = (userIdToLoad === currentUid && state.userProfile)
    ? state.userProfile
    : await dbService.getUserProfile(userIdToLoad);

  if (!profile) {
    showToast("Profile could not be found.", true);
    showFeedView();
    return;
  }

  // Populate Profile Header
  elements.profilePageAvatar.textContent = getInitials(profile.displayName);
  elements.profilePageName.textContent = profile.displayName;
  elements.profilePageHandle.textContent = profile.handle || "@member";
  elements.profilePageBio.textContent = profile.bio || "No bio added yet.";
  elements.profilePageJoined.textContent = `Joined ${profile.joinedAt || "October 2026"}`;

  const isSelf = currentUid && (currentUid === userIdToLoad);
  if (isSelf) {
    elements.profileEditBtn.style.display = "inline-flex";
    elements.profileFollowBtn.style.display = "none";
  } else {
    elements.profileEditBtn.style.display = "none";
    elements.profileFollowBtn.style.display = "inline-flex";

    const isFollowing = state.userProfile && Array.isArray(state.userProfile.following) && state.userProfile.following.includes(userIdToLoad);
    elements.profileFollowBtn.textContent = isFollowing ? "Unfollow" : "Follow";
    elements.profileFollowBtn.className = isFollowing ? "btn-secondary" : "btn-primary";
    elements.profileFollowBtn.dataset.targetId = userIdToLoad;
    elements.profileFollowBtn.dataset.following = isFollowing ? "true" : "false";
  }

  renderProfilePosts();
}

function renderProfilePosts() {
  const userId = state.viewingUserId;
  const userPosts = state.posts.filter((p) => p.authorId === userId);

  // Update profile counters
  elements.profilePagePostsCount.textContent = userPosts.length;
  
  // Fetch latest followers/following counts
  dbService.getUserProfile(userId).then((p) => {
    if (p) {
      elements.profilePageFollowersCount.textContent = (p.followers || []).length;
      elements.profilePageFollowingCount.textContent = (p.following || []).length;
    }
  });

  if (userPosts.length === 0) {
    elements.profilePostsStream.innerHTML = `
      <div class="empty-state">
        <h4 class="empty-state-title">No posts yet</h4>
        <p>This user has not published any posts to VibeNet.</p>
      </div>
    `;
    return;
  }

  elements.profilePostsStream.innerHTML = userPosts.map((post) => createPostCardMarkup(post)).join("");
}

function showFeedView() {
  state.activeView = "feed";
  state.viewingUserId = null;
  elements.mainFeedView.style.display = "block";
  elements.profilePageView.classList.remove("active");
  elements.navHomeItem.classList.add("active");
  elements.navProfileItem.classList.remove("active");
  renderFeed();
}

// Suggested Network Members
async function updateSuggestedMembers() {
  const allUsers = await dbService.getAllUsers();
  const currentUid = state.currentUser ? (state.currentUser.uid || state.currentUser.id) : null;
  const members = allUsers.filter((u) => u.id !== currentUid && u.uid !== currentUid);

  if (members.length === 0) {
    elements.suggestedUsersList.innerHTML = `<div style="font-size: 0.8125rem; color: var(--text-muted);">No other members online.</div>`;
    return;
  }

  elements.suggestedUsersList.innerHTML = members.slice(0, 5).map((m) => {
    const isFollowing = state.userProfile && Array.isArray(state.userProfile.following) && state.userProfile.following.includes(m.id || m.uid);
    return `
      <div class="suggested-user-item">
        <div class="suggested-user-info author-meta" data-user-id="${escapeHtml(m.id || m.uid)}">
          <div class="avatar avatar-sm">${escapeHtml(getInitials(m.displayName))}</div>
          <div class="suggested-meta">
            <div class="suggested-name">${escapeHtml(m.displayName)}</div>
            <div class="suggested-handle">${escapeHtml(m.handle || "@member")}</div>
          </div>
        </div>
        ${currentUid ? `
          <button class="${isFollowing ? "btn-secondary" : "btn-primary"} btn-follow" data-action="toggle-sidebar-follow" data-target-id="${escapeHtml(m.id || m.uid)}" data-following="${isFollowing}">
            ${isFollowing ? "Unfollow" : "Follow"}
          </button>
        ` : `
          <button class="btn-secondary btn-follow" data-action="prompt-auth">Follow</button>
        `}
      </div>
    `;
  }).join("");
}

// Authentication Modal Controls
function openAuthModal(defaultTab = "signin") {
  setAuthTab(defaultTab);
  elements.authErrorMessage.classList.remove("visible");
  elements.authErrorMessage.textContent = "";
  elements.authModal.classList.add("open");
}

function closeAuthModal() {
  elements.authModal.classList.remove("open");
  elements.authForm.reset();
}

function setAuthTab(tab) {
  if (tab === "signup") {
    elements.tabSignUp.classList.add("active");
    elements.tabSignIn.classList.remove("active");
    elements.displayNameGroup.style.display = "block";
    elements.authDisplayName.required = true;
    elements.authTitle.textContent = "Join VibeNet";
    elements.authSubmitBtn.textContent = "Create Account";
  } else {
    elements.tabSignIn.classList.add("active");
    elements.tabSignUp.classList.remove("active");
    elements.displayNameGroup.style.display = "none";
    elements.authDisplayName.required = false;
    elements.authTitle.textContent = "Welcome Back";
    elements.authSubmitBtn.textContent = "Log In";
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Brand Logo -> Go to Feed
  elements.navBrandLogo.addEventListener("click", (e) => {
    e.preventDefault();
    showFeedView();
  });

  // Sidebar Feed and Profile buttons
  elements.sidebarFeedBtn.addEventListener("click", () => showFeedView());
  elements.sidebarProfileBtn.addEventListener("click", () => {
    if (!state.currentUser) {
      openAuthModal("signin");
    } else {
      showProfileView();
    }
  });

  // Header Auth Buttons
  elements.openSignInBtn.addEventListener("click", () => openAuthModal("signin"));
  elements.openSignUpBtn.addEventListener("click", () => openAuthModal("signup"));
  elements.closeAuthModalBtn.addEventListener("click", () => closeAuthModal());

  // Modal Auth Tabs
  elements.tabSignIn.addEventListener("click", () => setAuthTab("signin"));
  elements.tabSignUp.addEventListener("click", () => setAuthTab("signup"));

  // Auth Form Submit
  elements.authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    elements.authErrorMessage.classList.remove("visible");
    const isSignUp = elements.tabSignUp.classList.contains("active");
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    const displayName = elements.authDisplayName.value.trim();

    try {
      if (isSignUp) {
        await authService.signUp(email, password, displayName);
        showToast("Account created successfully. Welcome to VibeNet.");
      } else {
        await authService.signIn(email, password);
        showToast("Logged in successfully.");
      }
      closeAuthModal();
    } catch (err) {
      elements.authErrorMessage.textContent = err.message || "Authentication failed. Check your credentials.";
      elements.authErrorMessage.classList.add("visible");
    }
  });

  // Demo Guest User Quick Access
  elements.demoAccountBtn.addEventListener("click", async () => {
    try {
      await authService.signIn("demo.user@vibenet.local", "demo123456");
      showToast("Logged in as Demo User.");
      closeAuthModal();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // User Dropdown Menu Toggle
  elements.userMenuToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    elements.userDropdownMenu.classList.toggle("open");
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (!elements.userDropdownMenu.contains(e.target) && !elements.userMenuToggleBtn.contains(e.target)) {
      elements.userDropdownMenu.classList.remove("open");
    }
  });

  // Dropdown Menu Items
  elements.navViewProfileBtn.addEventListener("click", () => {
    elements.userDropdownMenu.classList.remove("open");
    showProfileView();
  });

  elements.navEditProfileBtn.addEventListener("click", () => {
    elements.userDropdownMenu.classList.remove("open");
    openEditProfileModal();
  });

  elements.logoutBtn.addEventListener("click", async () => {
    elements.userDropdownMenu.classList.remove("open");
    await authService.signOut();
    showToast("Signed out successfully.");
    showFeedView();
  });

  // Composer Input Character Counter
  elements.postTextInput.addEventListener("input", () => {
    const len = elements.postTextInput.value.length;
    elements.charCounter.textContent = `${len} / 280`;
    if (len > 260) {
      elements.charCounter.className = "char-counter limit-near";
    } else {
      elements.charCounter.className = "char-counter";
    }
  });

  // Post Submission Form
  elements.createPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.currentUser) {
      openAuthModal("signin");
      return;
    }

    const content = elements.postTextInput.value.trim();
    if (!content) return;

    elements.publishPostBtn.disabled = true;

    try {
      const currentUid = state.currentUser.uid || state.currentUser.id;
      const authorName = (state.userProfile && state.userProfile.displayName) || state.currentUser.displayName || "Member";
      const authorHandle = (state.userProfile && state.userProfile.handle) || "@member";

      await dbService.createPost({
        authorId: currentUid,
        authorName: authorName,
        authorHandle: authorHandle,
        content: content
      });

      elements.postTextInput.value = "";
      elements.charCounter.textContent = "0 / 280";
      showToast("Post successfully shared.");
    } catch (err) {
      showToast(err.message || "Failed to publish post.", true);
    } finally {
      elements.publishPostBtn.disabled = false;
    }
  });

  // Feed Filter Tabs (All vs Following)
  elements.tabAllPosts.addEventListener("click", () => {
    elements.tabAllPosts.classList.add("active");
    elements.tabFollowingPosts.classList.remove("active");
    state.activeFilter = "all";
    renderFeed();
  });

  elements.tabFollowingPosts.addEventListener("click", () => {
    if (!state.currentUser) {
      openAuthModal("signin");
      return;
    }
    elements.tabFollowingPosts.classList.add("active");
    elements.tabAllPosts.classList.remove("active");
    state.activeFilter = "following";
    renderFeed();
  });

  // Global Search Input
  elements.globalSearchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderFeed();
  });

  // Feed Delegated Clicks (Likes, Comments, Delete, Profiles, Shares)
  document.addEventListener("click", async (e) => {
    // 1. Author Profile Click
    const authorMeta = e.target.closest(".author-meta");
    if (authorMeta && authorMeta.dataset.userId) {
      e.preventDefault();
      showProfileView(authorMeta.dataset.userId);
      return;
    }

    // 2. Toggle Like
    const likeBtn = e.target.closest("[data-action='toggle-like']");
    if (likeBtn) {
      if (!state.currentUser) {
        openAuthModal("signin");
        return;
      }
      const postId = likeBtn.dataset.postId;
      const isCurrentlyLiked = likeBtn.dataset.liked === "true";
      const currentUid = state.currentUser.uid || state.currentUser.id;
      await dbService.toggleLike(postId, currentUid, isCurrentlyLiked);
      return;
    }

    // 3. Toggle Comments Drawer
    const commentBtn = e.target.closest("[data-action='toggle-comments']");
    if (commentBtn) {
      const postId = commentBtn.dataset.postId;
      const drawer = document.getElementById(`comments-${postId}`);
      if (drawer) {
        if (state.openCommentPostIds.has(postId)) {
          state.openCommentPostIds.delete(postId);
          drawer.classList.remove("open");
        } else {
          state.openCommentPostIds.add(postId);
          drawer.classList.add("open");
          const input = drawer.querySelector(".comment-input");
          if (input) input.focus();
        }
      }
      return;
    }

    // 4. Share Post Link
    const shareBtn = e.target.closest("[data-action='share-post']");
    if (shareBtn) {
      navigator.clipboard?.writeText(window.location.origin + window.location.pathname + "#post-" + shareBtn.dataset.postId);
      showToast("Post link copied to clipboard.");
      return;
    }

    // 5. Delete Post Trigger
    const deleteBtn = e.target.closest("[data-action='delete-post']");
    if (deleteBtn) {
      state.postToDeleteId = deleteBtn.dataset.postId;
      elements.deleteConfirmModal.classList.add("open");
      return;
    }

    // 6. Sidebar Follow Button
    const followSidebarBtn = e.target.closest("[data-action='toggle-sidebar-follow']");
    if (followSidebarBtn) {
      const targetId = followSidebarBtn.dataset.targetId;
      const isCurrentlyFollowing = followSidebarBtn.dataset.following === "true";
      const currentUid = state.currentUser.uid || state.currentUser.id;

      await dbService.toggleFollow(currentUid, targetId, isCurrentlyFollowing);
      if (state.userProfile) {
        if (isCurrentlyFollowing) {
          state.userProfile.following = (state.userProfile.following || []).filter((id) => id !== targetId);
        } else {
          if (!state.userProfile.following) state.userProfile.following = [];
          state.userProfile.following.push(targetId);
        }
      }
      updateQuickCard(state.userProfile);
      updateSuggestedMembers();
      showToast(isCurrentlyFollowing ? "Unfollowed member." : "Following member.");
      return;
    }

    // 7. Prompt Auth Action
    if (e.target.closest("[data-action='prompt-auth']")) {
      openAuthModal("signin");
      return;
    }
  });

  // Comment Submission Form (Delegated)
  document.addEventListener("submit", async (e) => {
    const commentForm = e.target.closest(".comment-composer");
    if (commentForm) {
      e.preventDefault();
      if (!state.currentUser) {
        openAuthModal("signin");
        return;
      }

      const postId = commentForm.dataset.postId;
      const input = commentForm.querySelector(".comment-input");
      const content = input.value.trim();
      if (!content) return;

      const currentUid = state.currentUser.uid || state.currentUser.id;
      const authorName = (state.userProfile && state.userProfile.displayName) || state.currentUser.displayName || "Member";

      await dbService.addComment(postId, {
        id: "cmt_" + Date.now().toString(36),
        authorId: currentUid,
        authorName: authorName,
        content: content,
        createdAtIso: new Date().toISOString()
      });

      input.value = "";
      showToast("Comment posted.");
    }
  });

  // Delete Post Modal Actions
  elements.closeDeleteModalBtn.addEventListener("click", () => {
    elements.deleteConfirmModal.classList.remove("open");
    state.postToDeleteId = null;
  });

  elements.cancelDeleteBtn.addEventListener("click", () => {
    elements.deleteConfirmModal.classList.remove("open");
    state.postToDeleteId = null;
  });

  elements.confirmDeleteBtn.addEventListener("click", async () => {
    if (state.postToDeleteId) {
      try {
        await dbService.deletePost(state.postToDeleteId);
        showToast("Post deleted.");
      } catch (err) {
        showToast(err.message || "Failed to delete post.", true);
      }
    }
    elements.deleteConfirmModal.classList.remove("open");
    state.postToDeleteId = null;
  });

  // Edit Profile Modal
  elements.profileEditBtn.addEventListener("click", () => openEditProfileModal());
  elements.closeEditProfileBtn.addEventListener("click", () => closeEditProfileModal());
  elements.cancelEditProfileBtn.addEventListener("click", () => closeEditProfileModal());

  elements.editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.currentUser || !state.userProfile) return;

    const newName = elements.editDisplayName.value.trim();
    const newBio = elements.editBio.value.trim();
    const currentUid = state.currentUser.uid || state.currentUser.id;

    try {
      await dbService.setUserProfile(currentUid, {
        displayName: newName,
        bio: newBio
      });

      state.userProfile.displayName = newName;
      state.userProfile.bio = newBio;

      renderAuthNav(true);
      showProfileView(currentUid);
      closeEditProfileModal();
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(err.message || "Failed to update profile.", true);
    }
  });

  // Profile View Follow/Unfollow Button
  elements.profileFollowBtn.addEventListener("click", async () => {
    if (!state.currentUser) {
      openAuthModal("signin");
      return;
    }
    const targetId = elements.profileFollowBtn.dataset.targetId;
    const isCurrentlyFollowing = elements.profileFollowBtn.dataset.following === "true";
    const currentUid = state.currentUser.uid || state.currentUser.id;

    await dbService.toggleFollow(currentUid, targetId, isCurrentlyFollowing);

    if (state.userProfile) {
      if (isCurrentlyFollowing) {
        state.userProfile.following = (state.userProfile.following || []).filter((id) => id !== targetId);
      } else {
        if (!state.userProfile.following) state.userProfile.following = [];
        state.userProfile.following.push(targetId);
      }
    }

    showProfileView(targetId);
    updateQuickCard(state.userProfile);
    updateSuggestedMembers();
    showToast(isCurrentlyFollowing ? "Unfollowed member." : "Following member.");
  });

  // Footer System Status Link
  const footerStatus = document.getElementById("footerStatusLink");
  if (footerStatus) {
    footerStatus.addEventListener("click", (e) => {
      e.preventDefault();
      const mode = isLiveFirebaseConfigured ? "Live Cloud Firestore & Firebase Auth" : "Local BaaS Storage Adapter (Ready for Firebase credentials)";
      showToast(`System Operational: ${mode}`);
    });
  }
}

function openEditProfileModal() {
  if (!state.userProfile) return;
  elements.editDisplayName.value = state.userProfile.displayName || "";
  elements.editBio.value = state.userProfile.bio || "";
  elements.editProfileModal.classList.add("open");
}

function closeEditProfileModal() {
  elements.editProfileModal.classList.remove("open");
}

// Start Application on DOM Ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

