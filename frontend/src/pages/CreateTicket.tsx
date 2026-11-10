import { useEffect, useState, FormEvent } from 'react';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import { ticketsApi, patientsApi } from '../api';
import { Patient } from '../types';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [patientId, setPatientId] = useState<number | ''>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const { data } = await patientsApi.list({});
        setPatients(data.results ?? data);
      } catch {
        setPatients([]);
      }
    };
    loadPatients();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await ticketsApi.create({
        title,
        description,
        priority,
        patient_id: patientId || null,
      });
      setSubmitted(true);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setPatientId('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data || 'Failed to create ticket.');
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <PlusCircle className="text-primary" size={28} /> Create Clinical Ticket
        </h1>
      </header>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 780, margin: '0 auto' }}>
          <div className="card-body">
            <p className="text-muted" style={{ marginBottom: 16 }}>
              Doctors and nurses can create a ticket when they detect an issue with a patient.
            </p>

            {submitted && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                Ticket successfully created and admin has been notified.
              </div>
            )}

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-label">
                  Title
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Describe the issue briefly"
                  />
                </label>

                <label className="form-label">
                  Priority
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-select"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="form-label" style={{ marginTop: 16 }}>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  className="form-textarea"
                  placeholder="Provide a clear description of the clinical problem."
                />
              </label>

              <label className="form-label" style={{ marginTop: 16 }}>
                Related patient (optional)
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
                  className="form-select"
                >
                  <option value="">No patient selected</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_number} — {patient.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 20 }}>
                <button type="submit" className="btn btn-primary">
                  <AlertTriangle size={16} style={{ marginRight: 8 }} /> Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
