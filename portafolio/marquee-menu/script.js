const closestEdge = (x, y, w, h) => {
  const topEdgeDist = distMetric(x, y, w / 2, 0);
  const bottomEdgeDist = distMetric(x, y, w / 2, h);
  const min = Math.min(topEdgeDist, bottomEdgeDist);
  return min === topEdgeDist ? 'top' : 'bottom';
};

const distMetric = (x, y, x2, y2) => {
  const xDiff = x - x2;
  const yDiff = y - y2;
  return (xDiff * xDiff) + (yDiff * yDiff);
};

class MenuItem {
  constructor(el) {
    this.DOM = { el };
    this.DOM.link = this.DOM.el.querySelector('.menu__item-link');
    this.DOM.marquee = this.DOM.el.querySelector('.marquee');
    this.DOM.marqueeInner = this.DOM.marquee.querySelector('.marquee__inner-wrap');
    this.animationDefaults = { duration: 0.6, ease: 'expo.out' };
    this.initEvents();
  }

  initEvents() {
    this.onMouseEnterFn = (ev) => this.mouseEnter(ev);
    this.DOM.link.addEventListener('mouseenter', this.onMouseEnterFn);
    this.onMouseLeaveFn = (ev) => this.mouseLeave(ev);
    this.DOM.link.addEventListener('mouseleave', this.onMouseLeaveFn);
  }

  mouseEnter(ev) {
    const edge = this.findClosestEdge(ev);

    gsap.timeline({ defaults: this.animationDefaults })
      .set(this.DOM.marquee, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(this.DOM.marqueeInner, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([this.DOM.marquee, this.DOM.marqueeInner], { y: '0%' }, 0);
  }

  mouseLeave(ev) {
    const edge = this.findClosestEdge(ev);

    gsap.timeline({ defaults: this.animationDefaults })
      .to(this.DOM.marquee, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(this.DOM.marqueeInner, { y: edge === 'top' ? '101%' : '-101%' }, 0);
  }

  findClosestEdge(ev) {
    const x = ev.pageX - this.DOM.el.offsetLeft;
    const y = ev.pageY - this.DOM.el.offsetTop;
    return closestEdge(x, y, this.DOM.el.clientWidth, this.DOM.el.clientHeight);
  }
}

class Menu {
  constructor(el) {
    this.DOM = { el };
    this.DOM.menuItems = this.DOM.el.querySelectorAll('.menu__item');
    this.menuItems = [];
    this.DOM.menuItems.forEach((menuItem) => this.menuItems.push(new MenuItem(menuItem)));
  }
}

new Menu(document.querySelector('.menu'));
