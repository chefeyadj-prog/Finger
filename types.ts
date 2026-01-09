
export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  fingerprint_id: string;
  status: 'active' | 'on_leave' | 'terminated';
  avatar?: string;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in: string;
  check_out?: string;
  date: string;
  status: 'present' | 'late' | 'absent' | 'half_day';
}

export interface BiometricDevice {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  serial_number: string;
  status: 'online' | 'offline' | 'connecting';
  last_sync?: string;
}
