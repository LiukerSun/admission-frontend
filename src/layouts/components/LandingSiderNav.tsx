import { CalendarOutlined } from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
import { LANDING_NAV_ITEMS } from './landingNavItems'

const calendarDays = [
  { day: '03', label: '模拟', active: false },
  { day: '08', label: '位次', active: true },
  { day: '12', label: '院校', active: false },
  { day: '18', label: '草案', active: false },
]

export default function LandingSiderNav() {
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    ['landingNavItem', isActive ? 'landingNavItemActive' : ''].filter(Boolean).join(' ')

  return (
    <>
      <div className="landingBrand">
        <div className="landingBrandMark" />
        智慧高考
      </div>
      <nav className="landingNav">
        {LANDING_NAV_ITEMS.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} className={navItemClass}>
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="landingSideCard">
        <div className="landingSideCardHeader">
          <CalendarOutlined />
          报考月历
        </div>
        <div className="landingSideCardGlass">
          <div className="calendarMonth">2026 · June</div>
          <div className="calendarGrid">
            {calendarDays.map((item) => (
              <div className={['calendarDay', item.active ? 'calendarDayActive' : ''].filter(Boolean).join(' ')} key={item.day}>
                <strong>{item.day}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="calendarNote">
            <span>下一步</span>
            <strong>确认目标批次与省份规则</strong>
          </div>
        </div>
      </div>
    </>
  )
}

