import { useAuth } from '../context/AuthContext';
import { CheckCircle, ArrowRight, Hand } from 'lucide-react';

interface ProfileOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileClick: () => void;
}

export default function ProfileOnboardingModal({ isOpen, onClose, onProfileClick }: ProfileOnboardingModalProps) {
  const { user } = useAuth();
  const isMother = user?.role === 'MOTHER';

  if (!isOpen || !user || user.profile_completed) return null;

  const benefits = isMother
    ? [
        'Confirm your contact details',
        'Keep your phone number up to date',
        'Personalize your mother portal account',
      ]
    : [
        'Add your professional bio',
        'Update your contact information',
        'Personalize your account',
      ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: '32px',
        maxWidth: 500,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--hosp-blue), var(--purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <Hand size={24} />
          </div>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              Welcome, {user.full_name?.split(' ')[0]}!
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              margin: '4px 0 0 0',
            }}>
              {isMother ? 'Let\'s finish setting up your portal' : 'Let\'s get you set up'}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 24,
        }}>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {isMother
              ? 'Complete your profile so your care team can reach you with important updates and instructions.'
              : 'Complete your profile to help your colleagues get to know you better and personalize your experience.'}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {benefits.map((benefit, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
              }}>
                <CheckCircle size={16} style={{ color: 'var(--hosp-green)' }} />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Skip for now
          </button>
          <button
            onClick={onProfileClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--hosp-blue)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Complete Profile <ArrowRight size={18} />
          </button>
        </div>

        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginTop: 16,
          textAlign: 'center',
          margin: '16px 0 0 0',
        }}>
          You can update this later in your profile settings
        </p>
      </div>
    </div>
  );
}
