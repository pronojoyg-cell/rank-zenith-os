const now = Date.now();
const isoDaysAgo = (days: number) => new Date(now - days * 86400000).toISOString();

export const demoTasks = [
  { id: "demo-task-1", title: "Rotational dynamics timed set", target: 30, done: 30 },
  { id: "demo-task-2", title: "Revise coordination compounds", target: 1, done: 1 },
  { id: "demo-task-3", title: "Analyse yesterday's mock errors", target: 12, done: 7 },
];

export const demoPractice = [
  { id: "demo-p1", subject: "Physics", chapter: "Rotational Dynamics", attempted: 35, correct: 28, duration_min: 62, difficulty: "hard", created_at: isoDaysAgo(1) },
  { id: "demo-p2", subject: "Chemistry", chapter: "Coordination Compounds", attempted: 40, correct: 35, duration_min: 48, difficulty: "medium", created_at: isoDaysAgo(2) },
  { id: "demo-p3", subject: "Maths", chapter: "Definite Integration", attempted: 30, correct: 21, duration_min: 55, difficulty: "advanced", created_at: isoDaysAgo(3) },
  { id: "demo-p4", subject: "Physics", chapter: "Electrostatics", attempted: 25, correct: 22, duration_min: 36, difficulty: "easy", created_at: isoDaysAgo(5) },
];

export const demoFocus = [
  { id: "demo-f1", subject: "Physics", label: "Rotation problem set", duration_sec: 5400, distractions: 1, started_at: isoDaysAgo(1) },
  { id: "demo-f2", subject: "Maths", label: "Integration drills", duration_sec: 4200, distractions: 2, started_at: isoDaysAgo(2) },
  { id: "demo-f3", subject: "Chemistry", label: "Inorganic revision", duration_sec: 3600, distractions: 0, started_at: isoDaysAgo(4) },
];

export const demoMistakes = [
  { id: "demo-e1", subject: "Physics", chapter: "Rotation", question: "Used conservation of momentum instead of angular momentum", type: "concept", mark_cost: 4, notes: "Check external torque first", resolved: false, created_at: isoDaysAgo(1) },
  { id: "demo-e2", subject: "Maths", chapter: "Integration", question: "Missed a negative sign after substitution", type: "silly", mark_cost: 4, notes: "Write limits after substitution", resolved: false, created_at: isoDaysAgo(2) },
  { id: "demo-e3", subject: "Chemistry", chapter: "Electrochemistry", question: "Applied log base e instead of base 10", type: "calculation", mark_cost: 4, notes: "Use the standard Nernst form", resolved: true, created_at: isoDaysAgo(5) },
];

export const demoRevisions = [
  { id: "demo-r1", topic: "Rotational Dynamics", subject: "Physics", stage: "D3", confidence: 65, next_review_at: isoDaysAgo(1) },
  { id: "demo-r2", topic: "Coordination Compounds", subject: "Chemistry", stage: "D7", confidence: 78, next_review_at: isoDaysAgo(0) },
  { id: "demo-r3", topic: "Definite Integration", subject: "Maths", stage: "D14", confidence: 72, next_review_at: new Date(now + 86400000).toISOString() },
  { id: "demo-r4", topic: "Electrostatics", subject: "Physics", stage: "mastered", confidence: 94, next_review_at: new Date(now + 30 * 86400000).toISOString() },
];

export const demoMocks = [
  { id: "demo-m1", name: "JEE Main Full Test 08", taken_on: isoDaysAgo(21), physics: 68, chemistry: 72, maths: 58, marks: 198, max_marks: 300, rank_projection: 1640, silly_loss: 12, concept_loss: 20, time_loss: 16 },
  { id: "demo-m2", name: "JEE Main Full Test 09", taken_on: isoDaysAgo(12), physics: 74, chemistry: 76, maths: 64, marks: 214, max_marks: 300, rank_projection: 920, silly_loss: 8, concept_loss: 16, time_loss: 12 },
  { id: "demo-m3", name: "JEE Main Full Test 10", taken_on: isoDaysAgo(3), physics: 79, chemistry: 81, maths: 70, marks: 230, max_marks: 300, rank_projection: 430, silly_loss: 8, concept_loss: 12, time_loss: 8 },
];

export const demoLeaderboard = [
  { id: "demo-l1", display_name: "Aarav S.", target_air: 12, current_streak: 47, total_points: 4820 },
  { id: "demo-l2", display_name: "Ishita R.", target_air: 25, current_streak: 41, total_points: 4310 },
  { id: "demo-l3", display_name: "Kabir M.", target_air: 38, current_streak: 36, total_points: 3995 },
  { id: "demo-l4", display_name: "Diya P.", target_air: 55, current_streak: 28, total_points: 3520 },
  { id: "demo-l5", display_name: "Rohan K.", target_air: 80, current_streak: 22, total_points: 3110 },
  { id: "demo-l6", display_name: "Sneha V.", target_air: 95, current_streak: 19, total_points: 2780 },
];

export const demoChatPeers = [
  { id: "demo-peer-1", name: "Ishita R.", streak: 41, last: "Did you solve Q18 from the rotation sheet?", time: "2m" },
  { id: "demo-peer-2", name: "Kabir M.", streak: 36, last: "Mock analysis at 8?", time: "18m" },
  { id: "demo-peer-3", name: "Diya P.", streak: 28, last: "Shared a chemistry shortcut", time: "1h" },
];

export const demoChatMessages = [
  { id: "demo-msg-1", room_id: "demo-room", sender_id: "demo-peer-1", message_text: "How did your rotation set go?", created_at: isoDaysAgo(0), deleted_for_everyone: false, deleted_by_users: [], media_url: null, message_type: "text" },
  { id: "demo-msg-2", room_id: "demo-room", sender_id: "demo-user", message_text: "28/35. I still leak marks on rolling constraints.", created_at: new Date(now - 180000).toISOString(), deleted_for_everyone: false, deleted_by_users: [], media_url: null, message_type: "text" },
  { id: "demo-msg-3", room_id: "demo-room", sender_id: "demo-peer-1", message_text: "Same. Let's compare the three hardest questions tonight.", created_at: new Date(now - 60000).toISOString(), deleted_for_everyone: false, deleted_by_users: [], media_url: null, message_type: "text" },
];

export const demoGroups = [
  { id: "demo-g1", name: "AIR < 500 Sprint", last: "Kabir: Mock review starts at 8 PM", time: "5m", unread: 3, members: 48, avatar: "A", color: "from-primary to-chart-4" },
  { id: "demo-g2", name: "Physics Problem Solvers", last: "New rotation sheet uploaded", time: "42m", unread: 1, members: 126, avatar: "P", color: "from-chart-1 to-chart-4" },
];

export const demoClips = [
  { id: "demo-c1", user: "Ishita R.", handle: "@ishita", avatar: "I", color: "from-primary to-chart-4", caption: "A 30-second way to check the direction of friction in rolling problems.", likes: 184, comments: 23, shares: 41, views: "2.1K", time: "1h", hasVideo: true, topic: "Physics", topicColor: "bg-primary/15 text-primary" },
  { id: "demo-c2", user: "Kabir M.", handle: "@kabir", avatar: "K", color: "from-chart-3 to-chart-4", caption: "My post-mock analysis template: classify every lost mark before revising.", likes: 132, comments: 18, shares: 29, views: "1.4K", time: "3h", hasVideo: false, topic: "Strategy", topicColor: "bg-gold/15 text-gold" },
];

export const demoCommunities = [
  { id: "demo-community-1", name: "JEE 2027 Elite", desc: "Daily accountability and advanced problem discussion.", avatar: "J", color: "from-primary to-chart-4", members: 2840, channels: ["general", "physics", "mock-analysis"], joined: true, verified: true },
  { id: "demo-community-2", name: "Organic Chemistry Lab", desc: "Mechanisms, named reactions, and compact revision maps.", avatar: "O", color: "from-chart-3 to-chart-1", members: 1680, channels: ["general", "mechanisms"], joined: false, verified: true },
];