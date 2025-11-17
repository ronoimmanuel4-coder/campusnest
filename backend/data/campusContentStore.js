let campusEvents = [
  {
    id: 1,
    title: 'Campus Housing Fair',
    date: 'Nov 20',
    location: 'Student Center',
    description: 'Meet landlords and explore housing options near campus.'
  },
  {
    id: 2,
    title: 'Roommate Meetup',
    date: 'Nov 22',
    location: 'Library Lawn',
    description: 'Find your perfect roommate match in person.'
  }
];

let campusLinks = [
  { id: 1, label: 'Library Hours', type: 'library' },
  { id: 2, label: 'Cafeteria Menu', type: 'cafeteria' },
  { id: 3, label: 'Sports Facilities', type: 'sports' },
  { id: 4, label: 'Study Spots', type: 'study' }
];

let studentServices = [
  {
    id: 1,
    key: 'grocery',
    title: 'Grocery Delivery',
    description: 'Get groceries delivered to your hostel',
    ctaLabel: 'Order Now →',
    url: null,
    enabled: true
  },
  {
    id: 2,
    key: 'tutoring',
    title: 'Tutoring Services',
    description: 'Connect with peer tutors',
    ctaLabel: 'Find Tutors →',
    url: null,
    enabled: true
  },
  {
    id: 3,
    key: 'discounts',
    title: 'Student Discounts',
    description: 'Exclusive deals for students',
    ctaLabel: 'View Deals →',
    url: null,
    enabled: true
  }
];

const getCampusContent = () => ({
  events: campusEvents,
  links: campusLinks,
  studentServices
});

const updateCampusContent = ({ events, links, studentServices: incomingServices }) => {
  if (Array.isArray(events)) {
    campusEvents = events.map((e, index) => ({
      id: e.id || index + 1,
      title: e.title,
      date: e.date,
      location: e.location,
      description: e.description || ''
    }));
  }

  if (Array.isArray(links)) {
    campusLinks = links.map((l, index) => ({
      id: l.id || index + 1,
      label: l.label,
      type: l.type || 'custom',
      url: l.url || null
    }));
  }

  if (Array.isArray(incomingServices)) {
    studentServices = incomingServices.map((s, index) => ({
      id: s.id || index + 1,
      key: s.key || `service-${index + 1}`,
      title: s.title,
      description: s.description || '',
      ctaLabel: s.ctaLabel || 'Learn more',
      url: s.url || null,
      enabled: s.enabled !== false
    }));
  }

  return {
    events: campusEvents,
    links: campusLinks,
    studentServices
  };
};

module.exports = {
  getCampusContent,
  updateCampusContent
};
