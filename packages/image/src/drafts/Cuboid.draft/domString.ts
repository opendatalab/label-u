export default `
<div id="labelu_cuboid_switch">
<style>
#labelu_cuboid_switch {
  font-size: 14px;
  width: 28px;
  border-radius: 2px;
  background-color: #FFFFFF;
  padding: 8px 0;
  box-shadow: rgba(0, 0, 0, 0.17) 0px 1px 2px 0px;
  border: 1px solid rgb(229, 229, 229);
}

#labelu_cuboid_more_icon {
  padding: 8px 0;
}

#labelu_cuboid_other_perspective {
  display: none;
  height: 28px;
  border-radius: 2px;
  background-color: #FFFFFF;
  z-index: 3;
  padding: 0 8px;
  position: absolute;
  bottom: -4px;
  left: 30px;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

#labelu_cuboid_switch_inner {
  position: relative;
  cursor: default;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  text-align: center;
}

.labelu-cuboid-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
</style>
<div id="labelu_cuboid_switch_inner">
<div id="labelu_cuboid_switch_front_back">
  <div class="labelu-cuboid-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" id="" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="7.33337" y="0.333344" width="6" height="6" rx="0.666667" fill="#1B67FF" />
      <rect x="0.333374" y="7.66666" width="6" height="6" rx="0.666667" fill="#1B67FF" />
      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M3.08368 1.10129C4.0149 0.518256 5.10482 0.333008 5.83328 0.333008V1.66634C5.28396 1.66634 4.45722 1.81443 3.79122 2.2314C3.16099 2.62598 2.66659 3.09208 2.66659 4.16634L1.33325 4.16634C1.33325 2.57393 2.11669 1.7067 3.08368 1.10129Z"
        fill="#1B67FF" />
      <path
        d="M2.2101 6.31059C2.14535 6.38816 2.02702 6.39073 1.95896 6.31605L0.254134 4.44527C0.156611 4.33825 0.232537 4.16634 0.377322 4.16634L3.64373 4.16634C3.7851 4.16634 3.86227 4.33128 3.77168 4.43981L2.2101 6.31059Z"
        fill="#1B67FF" />
      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M10.7496 13.0224C9.81838 13.6055 8.72846 13.7907 8 13.7907V12.4574C8.54932 12.4574 9.37606 12.3093 10.0421 11.8923C10.6723 11.4977 11.1667 11.0316 11.1667 9.95738H12.5C12.5 11.5498 11.7166 12.417 10.7496 13.0224Z"
        fill="#1B67FF" />
      <path
        d="M11.6232 7.81313C11.6879 7.73556 11.8063 7.73299 11.8743 7.80767L13.5791 9.67845C13.6767 9.78547 13.6007 9.95738 13.456 9.95738H10.1896C10.0482 9.95738 9.97101 9.79244 10.0616 9.68391L11.6232 7.81313Z"
        fill="#1B67FF" />
    </svg>
  </div>
</div>
<div id="labelu_cuboid_more">
  <div id="labelu_cuboid_more_icon" class="labelu-cuboid-icon">
    <svg width="16" height="4" viewBox="0 0 16 4" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="2" cy="2" r="2" fill="#666"></circle>
      <circle cx="8" cy="2" r="2" fill="#666"></circle>
      <circle cx="14" cy="2" r="2" fill="#666"></circle>
    </svg>
  </div>
  <div id="labelu_cuboid_other_perspective">
    <div id="labelu_cuboid_right" class="labelu-cuboid-icon">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16.425 5.04961C16.35 4.82461 16.2 4.67461 15.975 4.59961L9.525 1.14961C9.225 0.999609 8.85 0.999609 8.55 1.14961L2.025 4.59961C1.725 4.74961 1.5 5.12461 1.5 5.49961V12.2496C1.5 12.6246 1.725 12.9996 2.025 13.1496L8.475 16.5996C8.7 16.6746 8.925 16.7496 9.15 16.6746C9.225 16.6746 9.375 16.5996 9.45 16.5996L15.9 13.1496C16.275 12.9996 16.5 12.6246 16.5 12.2496V5.49961C16.5 5.34961 16.425 5.19961 16.425 5.04961ZM9.15 8.87461V15.2496L9 15.3996L2.85 12.0996V5.64961L9 2.34961L15.15 5.64961L9.15 8.87461Z"
          fill="#1B67FF"></path>
      </svg>
    </div>
    <div id="labelu_cuboid_left" class="labelu-cuboid-icon">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16.425 5.04961C16.35 4.82461 16.2 4.67461 15.975 4.59961L9.525 1.14961C9.225 0.999609 8.85 0.999609 8.55 1.14961L2.025 4.59961C1.725 4.74961 1.5 5.12461 1.5 5.49961V12.2496C1.5 12.6246 1.725 12.9996 2.025 13.1496L8.475 16.5996C8.7 16.6746 8.925 16.7496 9.15 16.6746C9.225 16.6746 9.375 16.5996 9.45 16.5996L15.9 13.1496C16.275 12.9996 16.5 12.6246 16.5 12.2496V5.49961C16.5 5.34961 16.425 5.19961 16.425 5.04961ZM9.15 8.87461V15.2496L9 15.3996L2.85 12.0996V5.64961L9 2.34961L15.15 5.64961L9.15 8.87461Z"
          fill="#1B67FF"></path>
        <path d="M9 8.5V2.5L8.5 2L2.5 5.5V12.5L9 8.5Z" fill="#1B67FF"></path>
        <path d="M15.5 6L15 5.5L14.5 6L9 8.5V15.5H9.5L15.5 12.5V6Z" fill="white"></path>
      </svg>
    </div>
    <div id="labelu_cuboid_top" class="labelu-cuboid-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M2.18127 4.79539C2.02391 4.97285 1.96901 5.17775 2.01655 5.41011L2.25377 12.721C2.27386 13.0558 2.46136 13.3805 2.74127 13.5654L8.9916 17.4912C9.2715 17.676 9.7087 17.6833 10.0335 17.4958L15.8791 14.1208C16.2039 13.9333 16.4162 13.551 16.3961 13.2162L16.1589 5.9053C16.1113 5.67294 16.0638 5.44059 15.8863 5.28323C15.8488 5.21828 15.7089 5.12588 15.6714 5.06092L9.4586 1.20006C9.1412 0.950297 8.7039 0.942937 8.3791 1.13044L2.53348 4.50544C2.40357 4.58044 2.31117 4.72039 2.18127 4.79539ZM9.1313 9.18319L14.6522 5.99573L14.8571 6.05064L15.0742 13.0267L9.4884 16.2517L3.5555 12.5756L3.33838 5.59958L9.1313 9.18319Z"
          fill="#1B67FF" />
      </svg>
    </div>
  </div>
</div>
</div>
</div>
`;
