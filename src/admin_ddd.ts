import './admin.css'
import { AdminCore } from './lib/admin_core'

// Initialize the DDD specific administrative dashboard
document.addEventListener('DOMContentLoaded', () => {
  new AdminCore('DDD', 'admin-root')
})
