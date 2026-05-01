import { CalendarOutlined } from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
import { LANDING_NAV_ITEMS } from './landingNavItems'

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
        <div className="landingSideCardGlass" />
      </div>
    </>
  )
}

