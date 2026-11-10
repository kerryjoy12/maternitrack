import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  late final AnimationController _heroController;
  late final Animation<double> _heroFade;
  late final Animation<double> _heroBlur;
  late final AnimationController _cardController;
  late final Animation<Offset> _cardSlide;
  late final Animation<double> _cardFade;
  late final AnimationController _contentController;
  late final Animation<double> _contentFade;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _startEntranceAnimations();
  }

  void _initAnimations() {
    _heroController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );
    _heroFade = CurvedAnimation(
      parent: _heroController,
      curve: Curves.easeOutCubic,
    );
    _heroBlur = Tween<double>(begin: 0, end: 6).animate(
      CurvedAnimation(parent: _heroController, curve: Curves.easeInOut),
    );
    _cardController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _cardSlide = Tween<Offset>(
      begin: const Offset(0, 0.35),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _cardController, curve: Curves.easeOutCubic),
    );
    _cardFade = CurvedAnimation(
      parent: _cardController,
      curve: Curves.easeOut,
    );
    _contentController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _contentFade = CurvedAnimation(
      parent: _contentController,
      curve: Curves.easeOut,
    );
  }

  Future<void> _startEntranceAnimations() async {
    _heroController.forward();
    await Future<void>.delayed(const Duration(milliseconds: 250));
    _cardController.forward();
    await Future<void>.delayed(const Duration(milliseconds: 300));
    _contentController.forward();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _heroController.dispose();
    _cardController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(
      _emailCtrl.text.trim(),
      _passwordCtrl.text,
    );
    if (!mounted) return;
    if (!ok && auth.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error!)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final mq = MediaQuery.of(context);
    final screenH = mq.size.height;
    final screenW = mq.size.width;
    final heroHeight = (screenH * 0.40).clamp(240.0, 360.0);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFFF7FA), Color(0xFFFFFFFF)],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              left: -20,
              bottom: 0,
              child: IgnorePointer(
                child: CustomPaint(
                  size: const Size(180, 220),
                  painter: _LeafPainter(
                    alignment: Alignment.bottomLeft,
                    color: const Color(0xFFEC4899).withValues(alpha: 0.10),
                  ),
                ),
              ),
            ),
            Positioned(
              right: -20,
              bottom: 0,
              child: IgnorePointer(
                child: CustomPaint(
                  size: const Size(180, 220),
                  painter: _LeafPainter(
                    alignment: Alignment.bottomRight,
                    color: const Color(0xFFEC4899).withValues(alpha: 0.10),
                  ),
                ),
              ),
            ),
// Premium hero image: softly rounded top corners + extra-large bottom
// corners that curve smoothly into the white login card below. A pink
// gradient overlay is painted inside the same clip so the bottom of the
// image dissolves seamlessly into the card — no sharp edges, no straight
// lines. The card overlaps the image by ~40px so the two blend together.
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: heroHeight,
              child: AnimatedBuilder(
                animation: _heroController,
                builder: (context, _) {
                  return Opacity(
                    opacity: _heroFade.value,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(32),
                        topRight: Radius.circular(32),
                        bottomLeft: Radius.circular(56),
                        bottomRight: Radius.circular(56),
                      ),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          _HeroImage(blur: _heroBlur.value),
                          // Premium pink gradient overlay covering the lower
                          // ~35% of the image. Begins fully transparent,
                          // softly transitions through light pink, then
                          // fades cleanly to white where it meets the card
                          // — producing a seamless, premium transition with
                          // no visible seam or hard edge.
                          const DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  Colors.transparent,
                                  Color(0x33FFD8E8), // #FFD8E8 @ 20%
                                  Color(0x66FFC0D8), // #FFC0D8 @ 40%
                                  Color(0xFFFFE3EC), // soft pink mid
                                  Colors.white, // #FFFFFF
                                ],
                                stops: [
                                  0.00,
                                  0.55, // start fading at ~55% down
                                  0.70,
                                  0.82,
                                  0.93,
                                  1.00, // white at the very bottom
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
// The card overlaps the image by ~40px and uses `clipBehavior: Clip.none`
// on the scroll view so the pink gradient can extend slightly behind the
// card — this is what produces the seamless, floating transition.
            Positioned.fill(
              top: heroHeight - 40,
              child: SafeArea(
                top: false,
                child: SingleChildScrollView(
                  clipBehavior: Clip.none,
                  physics: const BouncingScrollPhysics(),
                  padding: EdgeInsets.only(
                    left: 20,
                    right: 20,
                    top: 0,
                    bottom: 24 + mq.viewInsets.bottom,
                  ),
                  child: SlideTransition(
                    position: _cardSlide,
                    child: FadeTransition(
                      opacity: _cardFade,
                      child: _buildLoginCard(screenW, auth),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

// Premium floating login card: large 38px border radius + soft, layered
// shadow for a natural lift. `clipBehavior: Clip.none` lets the hero
// image's pink gradient extend slightly behind the card top edge so the
// transition looks seamless — no hard line where card meets image.
  Widget _buildLoginCard(double screenW, AuthProvider auth) {
    final maxCardWidth = screenW > 600 ? 480.0 : double.infinity;
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxCardWidth),
        child: Container(
          clipBehavior: Clip.none,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(38),
            boxShadow: [
              // Soft, premium pink-tinted ambient shadow (wide & low-opacity)
              BoxShadow(
                color: const Color(0xFFEC4899).withValues(alpha: 0.10),
                blurRadius: 48,
                spreadRadius: 0,
                offset: const Offset(0, 18),
              ),
              // Subtle neutral shadow for natural depth
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 24,
                spreadRadius: 0,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 30, 24, 26),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FadeTransition(
                    opacity: _contentFade,
                    child: _buildLogoArea(),
                  ),
                  const SizedBox(height: 36),
                  FadeTransition(
                    opacity: _contentFade,
                    child: _buildEmailField(),
                  ),
                  const SizedBox(height: 32),
                  FadeTransition(
                    opacity: _contentFade,
                    child: _buildPasswordField(),
                  ),
                  const SizedBox(height: 36),
                  FadeTransition(
                    opacity: _contentFade,
                    child: _buildLoginButton(auth),
                  ),
                  const SizedBox(height: 18),
                  FadeTransition(
                    opacity: _contentFade,
                    child: _buildHeartFooter(),
                  ),
                  const SizedBox(height: 14),
                  FadeTransition(
                    opacity: _contentFade,
                    child: _buildAuthorizedFooter(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogoArea() {
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: const Color(0xFFEC4899).withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.favorite_rounded,
            color: Color(0xFFEC4899),
            size: 28,
          ),
        ),
        const SizedBox(height: 12),
        RichText(
          textAlign: TextAlign.center,
          text: const TextSpan(
            children: [
              TextSpan(
                text: 'Materni',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF222222),
                  letterSpacing: -0.5,
                  height: 1.1,
                ),
              ),
              TextSpan(
                text: 'Track',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFEC4899),
                  letterSpacing: -0.5,
                  height: 1.1,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Maternity Follow-Up Tracker',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: Color(0xFF777777),
            height: 1.3,
          ),
        ),
      ],
    );
  }

  Widget _buildEmailField() {
    return _PremiumTextField(
      controller: _emailCtrl,
      hint: 'Email',
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.next,
      autofillHints: const [AutofillHints.email],
      prefixIcon: Icons.email_outlined,
      validator: (v) {
        final value = v?.trim() ?? '';
        if (value.isEmpty) return 'Enter your email';
        if (!value.contains('@')) return 'Enter a valid email';
        return null;
      },
    );
  }

  Widget _buildPasswordField() {
    return _PremiumTextField(
      controller: _passwordCtrl,
      hint: 'Password',
      obscureText: _obscure,
      keyboardType: TextInputType.visiblePassword,
      textInputAction: TextInputAction.done,
      autofillHints: const [AutofillHints.password],
      prefixIcon: Icons.lock_outline,
      suffixIcon: IconButton(
        splashRadius: 20,
        icon: Icon(
          _obscure
              ? Icons.visibility_off_outlined
              : Icons.visibility_outlined,
          color: const Color(0xFF777777),
          size: 22,
        ),
        onPressed: () => setState(() => _obscure = !_obscure),
      ),
      validator: (v) {
        if (v == null || v.isEmpty) return 'Enter your password';
        return null;
      },
      onFieldSubmitted: (_) => _submit(),
    );
  }

  Widget _buildLoginButton(AuthProvider auth) {
    final disabled = auth.isBusy;
    return Container(
      height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFFFF5A8A), Color(0xFFFF3D7F)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF3D7F).withValues(alpha: 0.30),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: disabled ? null : _submit,
          splashColor: Colors.white.withValues(alpha: 0.18),
          highlightColor: Colors.white.withValues(alpha: 0.10),
          child: Center(
            child: disabled
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Login',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 0.2,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeartFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        Icon(Icons.favorite_rounded, color: Color(0xFFEC4899), size: 16),
        SizedBox(width: 8),
        Flexible(
          child: Text(
            "We're here for you and your baby",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFFEC4899),
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAuthorizedFooter() {
    return const Text(
      'Authorized staff only.\nContact your administrator for access.',
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: 12,
        color: Color(0xFF777777),
        height: 1.5,
      ),
    );
  }
}

// Premium rounded text field with a smooth, always-visible pink glow.
// Uses a single AnimatedContainer whose BoxDecoration contains the border,
// borderRadius, and boxShadow. The TextFormField sits inside this container
// with an OutlineInputBorder that matches the same radius so the border
// is drawn by the field itself and the glow renders fully outside it.
class _PremiumTextField extends StatefulWidget {
  const _PremiumTextField({
    required this.controller,
    required this.hint,
    required this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.validator,
    this.onFieldSubmitted,
  });

  final TextEditingController controller;
  final String hint;
  final IconData prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onFieldSubmitted;

  @override
  State<_PremiumTextField> createState() => _PremiumTextFieldState();
}

class _PremiumTextFieldState extends State<_PremiumTextField> {
  final FocusNode _focus = FocusNode();

  // Design tokens
  static const _radius = 30.0;
  static const _fieldHeight = 60.0;
  static const _idleBorder = Color(0xFFE8E8E8);
  static const _focusedBorder = Color(0xFFEC4899);
  static const _idleIcon = Color(0xFFB0B0B5);
  static const _textColor = Color(0xFF222222);
  static const _hintColor = Color(0xFFB0B0B5);

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final focused = _focus.hasFocus;
    final iconColor = focused ? _focusedBorder : _idleIcon;

    // Single AnimatedContainer draws the border, rounded corners and the
    // pink glow (via boxShadow). Because the shadow lives on the same
    // container as the field, it renders outside the border on all four
    // sides and is never clipped by a parent Stack/Positioned.
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOut,
      height: _fieldHeight,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(_radius),
        border: Border.all(
          color: focused ? _focusedBorder : _idleBorder,
          width: focused ? 1.6 : 1.2,
        ),
        boxShadow: focused
            ? const [
                // Soft, wide ambient glow
                BoxShadow(
                  color: Color(0x33EC4899), // ~20% pink
                  blurRadius: 22,
                  spreadRadius: 0,
                  offset: Offset(0, 0),
                ),
                // Tight, intense glow hugging the field
                BoxShadow(
                  color: Color(0x55EC4899), // ~33% pink
                  blurRadius: 14,
                  spreadRadius: 1,
                  offset: Offset(0, 0),
                ),
                // Subtle lifted shadow for depth
                BoxShadow(
                  color: Color(0x14EC4899), // ~8% pink
                  blurRadius: 28,
                  spreadRadius: 0,
                  offset: Offset(0, 6),
                ),
              ]
            : const [
                BoxShadow(
                  color: Color(0x08000000), // very subtle resting shadow
                  blurRadius: 8,
                  spreadRadius: 0,
                  offset: Offset(0, 2),
                ),
              ],
      ),
      child: TextFormField(
        controller: widget.controller,
        focusNode: _focus,
        obscureText: widget.obscureText,
        keyboardType: widget.keyboardType,
        textInputAction: widget.textInputAction,
        autofillHints: widget.autofillHints,
        cursorColor: _focusedBorder,
        style: const TextStyle(
          fontSize: 16,
          color: _textColor,
          fontWeight: FontWeight.w500,
          height: 1.2,
        ),
        validator: widget.validator,
        onFieldSubmitted: widget.onFieldSubmitted,
        decoration: InputDecoration(
          isDense: true,
          hintText: widget.hint,
          hintStyle: const TextStyle(
            color: _hintColor,
            fontWeight: FontWeight.w400,
            fontSize: 16,
            height: 1.2,
          ),
          // Tight, balanced padding so the text is perfectly vertically
          // centered inside the 60px field.
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 18,
          ),
          prefixIcon: SizedBox(
            width: 48,
            child: Center(
              child: Icon(
                widget.prefixIcon,
                color: iconColor,
                size: 20,
              ),
            ),
          ),
          prefixIconConstraints: const BoxConstraints(
            minWidth: 48,
            minHeight: 0,
          ),
          suffixIcon: widget.suffixIcon,
          suffixIconConstraints: const BoxConstraints(
            minWidth: 48,
            minHeight: 0,
          ),
          // Match the container's rounded shape; Flutter draws this on
          // the field itself so the border is never painted over.
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(_radius),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(_radius),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(_radius),
            borderSide: BorderSide.none,
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(_radius),
            borderSide: BorderSide.none,
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(_radius),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: Colors.white,
        ),
      ),
    );
  }
}

class _HeroImage extends StatelessWidget {
  const _HeroImage({required this.blur});
  final double blur;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFFFFF1F4),
                Color(0xFFFFE3EC),
                Color(0xFFFFD1DE),
              ],
            ),
          ),
        ),
        Image.asset(
          'assets/images/ChatGPT Image Jul 2, 2026, 09_12_18 AM.png',
          fit: BoxFit.cover,
          alignment: Alignment.center,
          errorBuilder: (context, error, stackTrace) =>
              const SizedBox.shrink(),
        ),
        if (blur > 0)
          Align(
            alignment: Alignment.bottomCenter,
            child: ClipRect(
              child: SizedBox(
                height: 120,
                width: double.infinity,
                child: ImageFiltered(
                  imageFilter: ui.ImageFilter.blur(
                    sigmaX: blur,
                    sigmaY: blur,
                  ),
                  child: const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Color(0xFFFF7CA8),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _LeafPainter extends CustomPainter {
  _LeafPainter({required this.alignment, required this.color});
  final Alignment alignment;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final mirror = alignment == Alignment.bottomRight;
    final stemPath = Path()
      ..moveTo(mirror ? size.width * 0.20 : size.width * 0.80,
          size.height * 0.95)
      ..quadraticBezierTo(
        mirror ? size.width * 0.30 : size.width * 0.70,
        size.height * 0.55,
        mirror ? size.width * 0.55 : size.width * 0.45,
        size.height * 0.05,
      );
    canvas.drawPath(
      stemPath,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _LeafPainter old) =>
      old.color != color || old.alignment != alignment;
}