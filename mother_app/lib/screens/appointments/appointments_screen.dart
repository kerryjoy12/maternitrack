import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../models/appointment.dart';
import '../../widgets/common_widgets.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  late Future<List<Appointment>> _future;
  String _tab = 'PENDING';

  @override
  void initState() {
    super.initState();
    _future = context.read<MotherApi>().appointments();
  }

  Future<void> _reload() async {
    setState(() {
      _future = context.read<MotherApi>().appointments();
    });
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'ANC1':
      case 'ANC2':
      case 'ANC3':
      case 'ANC4':
        return Icons.favorite_outline;
      case 'POSTNATAL_7DAY':
      case 'POSTNATAL_6WEEK':
        return Icons.verified_user_outlined;
      default:
        return Icons.event_note_outlined;
    }
  }

  Color _tabColor(String group) {
    switch (group) {
      case 'ATTENDED': return AppColors.success;
      case 'MISSED':   return AppColors.danger;
      default:         return AppColors.primary;
    }
  }

  Color _tabTint(String group) {
    switch (group) {
      case 'ATTENDED': return AppColors.successTint;
      case 'MISSED':   return AppColors.dangerTint;
      default:         return AppColors.primaryTint;
    }
  }

  String _badgeLabel(Appointment a) {
    switch (a.status) {
      case 'ATTENDED':    return 'Attended';
      case 'MISSED':      return 'Missed';
      case 'RESCHEDULED': return 'Tap to Reschedule';
      case 'CANCELLED':   return 'Cancelled';
      default:            return 'Tap to Reschedule';
    }
  }

  IconData _badgeIcon(Appointment a) {
    switch (a.status) {
      case 'ATTENDED':    return Icons.check_circle_outline;
      case 'MISSED':      return Icons.cancel_outlined;
      case 'RESCHEDULED': return Icons.touch_app_outlined;
      case 'CANCELLED':   return Icons.block_outlined;
      default:            return Icons.touch_app_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _reload,
      child: FutureBuilder<List<Appointment>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 200),
                LoadingView(),
              ],
            );
          }
          if (snap.hasError) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 100),
                ErrorView(
                  message: 'Could not load appointments.',
                  onRetry: _reload,
                ),
              ],
            );
          }
          final all = snap.data ?? const <Appointment>[];
          final filtered = all.where((a) => a.statusGroup == _tab).toList(growable: false);
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Text(
                  'Manage upcoming visits and review your appointment history.',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.add),
                      label: const Text('Book Appointment'),
                      onPressed: _openCreateAppointment,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _TabBar(
                current: _tab,
                onChanged: (v) => setState(() => _tab = v),
              ),
              const SizedBox(height: 16),
              if (filtered.isEmpty)
                AppCard(
                  child: const EmptyView(
                    message:
                        'No appointments found in this section.\nCheck back later or contact your clinic.',
                    icon: Icons.event_busy_outlined,
                  ),
                )
              else
                ...filtered.map(
                  (a) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: AppCard(
                      onTap: (a.status == 'UPCOMING' || a.status == 'RESCHEDULED')
                          ? () => _openReschedule(a)
                          : null,
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: _tabTint(a.statusGroup),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              _iconFor(a.appointmentType),
                              color: _tabColor(a.statusGroup),
                              size: 24,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            a.appointmentType.replaceAll('_', ' '),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            formatReferenceDate(a.scheduledDate),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 10),
                          StatusBadge(
                            label: _badgeLabel(a),
                            color: _tabColor(a.statusGroup),
                            icon: _badgeIcon(a),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _openCreateAppointment() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CreateAppointmentSheet(),
    );
    if (result == true) _reload();
  }

  Future<void> _openReschedule(Appointment a) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RescheduleSheet(appointment: a),
    );
    if (result == true) _reload();
  }
}

class _TabBar extends StatelessWidget {
  final String current;
  final ValueChanged<String> onChanged;
  const _TabBar({required this.current, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    const tabs = [
      ('PENDING',  'Pending',  AppColors.primary),
      ('ATTENDED', 'Attended', AppColors.success),
      ('MISSED',   'Missed',   AppColors.danger),
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: tabs.map((t) {
        final selected = current == t.$1;
        return Expanded(
          child: InkWell(
            onTap: () => onChanged(t.$1),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: selected ? t.$3 : Colors.transparent,
                    width: 2.5,
                  ),
                ),
              ),
              child: Center(
                child: Text(
                  t.$2,
                  style: TextStyle(
                    color: selected ? t.$3 : AppColors.textSecondary,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _CreateAppointmentSheet extends StatefulWidget {
  const _CreateAppointmentSheet();

  @override
  State<_CreateAppointmentSheet> createState() =>
      _CreateAppointmentSheetState();
}

class _CreateAppointmentSheetState extends State<_CreateAppointmentSheet> {
  static const _types = {
    'ANC1': 'ANC Visit 1',
    'ANC2': 'ANC Visit 2',
    'ANC3': 'ANC Visit 3',
    'ANC4': 'ANC Visit 4',
    'POSTNATAL_7DAY': 'Postnatal 7-Day Review',
    'POSTNATAL_6WEEK': 'Postnatal 6-Week Review',
    'OTHER': 'Other',
  };

  String _selectedType = 'ANC1';
  DateTime? _date;
  TimeOfDay? _time;
  final _notesCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  String _dateStr(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  String _timeStr(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> _submit() async {
    if (_date == null) {
      setState(() => _error = 'Please choose a date for the appointment.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<MotherApi>().createAppointment(
            appointmentType: _selectedType,
            scheduledDate: _dateStr(_date!),
            scheduledTime: _time == null ? null : _timeStr(_time!),
            notes: _notesCtrl.text.trim(),
          );
      if (!mounted) return;
      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Appointment booked successfully.')),
      );
    } catch (_) {
      setState(() => _error = 'Could not book the appointment. Try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Book Appointment',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Create a new appointment and it will appear in your system schedule and dashboard.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Appointment Type',
                prefixIcon: Icon(Icons.event_note_outlined),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedType,
                  onChanged: (value) {
                    if (value != null) setState(() => _selectedType = value);
                  },
                  items: _types.entries
                      .map(
                        (entry) => DropdownMenuItem(
                          value: entry.key,
                          child: Text(entry.value),
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) setState(() => _date = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Appointment Date',
                  prefixIcon: Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _date == null ? 'Choose date' : formatDate(_dateStr(_date!)),
                  style: TextStyle(
                    color: _date == null
                        ? AppColors.textMuted
                        : AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () async {
                final picked = await showTimePicker(
                  context: context,
                  initialTime: _time ?? TimeOfDay(hour: 9, minute: 0),
                );
                if (picked != null) setState(() => _time = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Appointment Time (Optional)',
                  prefixIcon: Icon(Icons.access_time),
                ),
                child: Text(
                  _time == null ? 'Any time' : _timeStr(_time!),
                  style: TextStyle(
                    color: _time == null
                        ? AppColors.textMuted
                        : AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                hintText: 'Reason or notes for this appointment',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(
                _error!,
                style: const TextStyle(
                  color: AppColors.danger,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Book Appointment'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RescheduleSheet extends StatefulWidget {
  final Appointment appointment;
  const _RescheduleSheet({required this.appointment});

  @override
  State<_RescheduleSheet> createState() => _RescheduleSheetState();
}

class _RescheduleSheetState extends State<_RescheduleSheet> {
  DateTime? _newDate;
  TimeOfDay? _newTime;
  final _reasonCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  String _dateStr(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  String _timeStr(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> _submit() async {
    if (_newDate == null) {
      setState(() => _error = 'Please choose a new date.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<MotherApi>().rescheduleAppointment(
            widget.appointment.id,
            scheduledDate: _dateStr(_newDate!),
            scheduledTime:
                _newTime == null ? null : _timeStr(_newTime!),
            reason: _reasonCtrl.text.trim(),
          );
      if (!mounted) return;
      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reschedule request submitted.')),
      );
    } catch (e) {
      setState(() => _error = 'Could not submit reschedule. Try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Request Reschedule',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Rescheduling ${widget.appointment.appointmentType.replaceAll('_', ' ')} appointment. Clinicians will be notified.',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _newDate ?? DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) setState(() => _newDate = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'New Date',
                  prefixIcon: Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _newDate == null ? 'Choose date' : formatDate(_dateStr(_newDate!)),
                  style: TextStyle(
                    color: _newDate == null
                        ? AppColors.textMuted
                        : AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () async {
                final picked = await showTimePicker(
                  context: context,
                  initialTime: _newTime ?? TimeOfDay.now(),
                );
                if (picked != null) setState(() => _newTime = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Preferred Time (Optional)',
                  prefixIcon: Icon(Icons.access_time),
                ),
                child: Text(
                  _newTime == null ? 'Any time' : _newTime!.format(context),
                  style: TextStyle(
                    color: _newTime == null
                        ? AppColors.textMuted
                        : AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _reasonCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Reason',
                hintText: 'e.g. work conflict, feeling unwell...',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(
                _error!,
                style: const TextStyle(
                  color: AppColors.danger,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Submit Request'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}