import './admin.css'
import { AdminCore } from './lib/admin_core'

// Initialize the AFTU-TATA specific administrative dashboard
document.addEventListener('DOMContentLoaded', () => {
  new AdminCore('AFTU-TATA', 'admin-root')
})
