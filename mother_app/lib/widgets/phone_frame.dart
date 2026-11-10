import 'package:flutter/material.dart';

/// Wraps the application in a realistic Android phone frame on Flutter Web.
///
/// On Android / iOS the [PhoneFrame] simply returns its child unchanged so
/// builds remain untouched.
class PhoneFrame extends StatelessWidget {
  final Widget child;

  /// Maximum height of the simulated device, in logical pixels.
  final double height;

  /// Maximum width of the simulated device, in logical pixels.
  final double width;

  const PhoneFrame({
    super.key,
    required this.child,
    this.height = 844,
    this.width = 390,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF1F3F8),
      alignment: Alignment.center,
      child: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Center(
            child: _DeviceShell(height: height, width: width, child: child),
          ),
        ),
      ),
    );
  }
}

class _DeviceShell extends StatelessWidget {
  final Widget child;
  final double height;
  final double width;
  const _DeviceShell({
    required this.child,
    required this.height,
    required this.width,
  });

  @override
  Widget build(BuildContext context) {
    final mediaWidth = MediaQuery.of(context).size.width;
    final scale = mediaWidth < width + 32
        ? ((mediaWidth - 32) / width).clamp(0.55, 1.0)
        : 1.0;
    return Transform.scale(
      scale: scale,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(48),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 30,
              offset: Offset(0, 12),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(38),
          child: Stack(
            children: [
              Positioned.fill(child: Container(color: Colors.white)),
              // Top notch
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 8),
                    width: 110,
                    height: 22,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
              ),
              // App content — leave room for the notch at top.
              Padding(
                padding: const EdgeInsets.only(top: 30),
                child: child,
              ),
            ],
          ),
        ),
      ),
    );
  }
}