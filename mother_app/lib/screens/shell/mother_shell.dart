import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../appointments/appointments_screen.dart';
import '../home/dashboard_screen.dart';
import '../journey/child_profile_screen.dart';
import '../journey/pregnancy_screen.dart';
import '../learn/learn_screen.dart';
import '../messages/messages_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../profile/settings_screen.dart';
import '../symptoms/symptoms_screen.dart';

class _NotifCount extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  Future<void> refresh(MotherApi api) async {
    try {
      _count = await api.unreadNotificationsCount();
      notifyListeners();
    } catch (_) {}
  }
}

class _UnreadMsgCount extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  Future<void> refresh(MotherApi api) async {
    try {
      final msgs = await api.listMessages();
      _count = msgs.where((m) => !m.isRead && (m.senderRole != 'MOTHER')).length;
      notifyListeners();
    } catch (_) {}
  }
}

/// Top-level shell that hosts the bottom navigation. Mirrors
/// `frontend/src/components/MotherLayout.tsx`.
class MotherShell extends StatefulWidget {
  const MotherShell({super.key});

  @override
  State<MotherShell> createState() => _MotherShellState();
}

class _MotherShellState extends State<MotherShell> {
  int _index = 0;
  final _notifCount = _NotifCount();
  final _msgCount = _UnreadMsgCount();

  late final List<Widget> _screens = [
    const DashboardScreen(),
    const AppointmentsScreen(),
    const _JourneyTab(),
    ProfileScreen(onTabChange: (i) => setState(() => _index = i)),
  ];

  static const _titles = ['Home', 'Appointments', 'Journey', 'Profile'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final api = context.read<MotherApi>();
      _notifCount.refresh(api);
      _msgCount.refresh(api);
    });
  }

  @override
  void dispose() {
    _notifCount.dispose();
    _msgCount.dispose();
    super.dispose();
  }

  Future<void> _openNotifications() async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
    );
    if (mounted) _notifCount.refresh(context.read<MotherApi>());
  }

  Future<void> _openMessages() async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const MessagesScreen()),
    );
    if (mounted) _msgCount.refresh(context.read<MotherApi>());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: _AppDrawer(
        onNavigate: (i) {
          Navigator.of(context).pop();
          setState(() => _index = i);
        },
      ),
      appBar: AppBar(
        title: Text(_titles[_index]),
        backgroundColor: AppColors.bgCard,
        elevation: 0,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        actions: [
          ListenableBuilder(
            listenable: _notifCount,
            builder: (_, _) => Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(
                  tooltip: 'Notifications',
                  icon: const Icon(Icons.notifications_none),
                  onPressed: _openNotifications,
                ),
                if (_notifCount.count > 0)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: AppColors.danger,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text(
                        _notifCount.count > 99 ? '99+' : '${_notifCount.count}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          ListenableBuilder(
            listenable: _msgCount,
            builder: (_, _) => Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(
                  tooltip: 'Messages',
                  icon: const Icon(Icons.forum_outlined),
                  onPressed: _openMessages,
                ),
                if (_msgCount.count > 0)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: AppColors.danger,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text(
                        _msgCount.count > 99 ? '99+' : '${_msgCount.count}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.event_outlined),
            activeIcon: Icon(Icons.event),
            label: 'Appointments',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.child_care_outlined),
            activeIcon: Icon(Icons.child_care),
            label: 'Journey',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _JourneyTab extends StatefulWidget {
  const _JourneyTab();

  @override
  State<_JourneyTab> createState() => _JourneyTabState();
}

class _JourneyTabState extends State<_JourneyTab>
    with SingleTickerProviderStateMixin {
  late final TabController _tab = TabController(length: 2, vsync: this);

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: AppColors.bgCard,
          child: TabBar(
            controller: _tab,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            indicatorWeight: 3,
            labelStyle: const TextStyle(fontWeight: FontWeight.w800),
            tabs: const [
              Tab(text: 'Pregnancy'),
              Tab(text: 'Child Profile'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tab,
            children: const [
              PregnancyScreen(),
              ChildProfileScreen(),
            ],
          ),
        ),
      ],
    );
  }
}

class _AppDrawer extends StatelessWidget {
  final ValueChanged<int> onNavigate;
  const _AppDrawer({required this.onNavigate});

  void _push(BuildContext context, Widget screen) {
    Navigator.of(context).pop();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: AppColors.bgCard,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Header ──────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.pink.withValues(alpha: 0.98), AppColors.pink.withValues(alpha: 0.85)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.20),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Text(
                        '🩷',
                        style: TextStyle(fontSize: 28),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'MaterniTrack',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.3,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Mother Portal',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // ── Main nav ────────────────────────────────────────────────
            _DrawerTile(
              icon: Icons.home_outlined,
              label: 'Home',
              onTap: () => onNavigate(0),
            ),
            _DrawerTile(
              icon: Icons.event_outlined,
              label: 'Appointments',
              onTap: () => onNavigate(1),
            ),
            _DrawerTile(
              icon: Icons.child_care_outlined,
              label: 'Journey',
              onTap: () => onNavigate(2),
            ),
            _DrawerTile(
              icon: Icons.person_outline,
              label: 'Profile',
              onTap: () => onNavigate(3),
            ),
            Divider(color: AppColors.pink.withValues(alpha: 0.20), thickness: 1, indent: 16, endIndent: 16),
            // ── Secondary nav ───────────────────────────────────────────
            _DrawerTile(
              icon: Icons.menu_book_outlined,
              label: 'Learn',
              onTap: () => _push(context, const LearnScreen()),
            ),
            _DrawerTile(
              icon: Icons.health_and_safety_outlined,
              label: 'Report Symptoms',
              onTap: () => _push(context, const SymptomsScreen()),
            ),
            _DrawerTile(
              icon: Icons.notifications_outlined,
              label: 'Notifications',
              onTap: () => _push(context, const NotificationsScreen()),
            ),
            _DrawerTile(
              icon: Icons.forum_outlined,
              label: 'Messages',
              onTap: () => _push(context, const MessagesScreen()),
            ),
            _DrawerTile(
              icon: Icons.settings_outlined,
              label: 'Settings',
              onTap: () => _push(context, const SettingsScreen()),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'MaterniTrack Mother v1.0.0',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.pink.withValues(alpha: 0.50),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _DrawerTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: AppColors.pink.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.pink, size: 18),
      ),
      title: Text(
        label,
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 14,
          color: AppColors.textPrimary,
        ),
      ),
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      horizontalTitleGap: 12,
    );
  }
}