import React, { useState, useEffect } from 'react';
import { Calendar, Link as LinkIcon, Plus, Trash2, Save } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminCampusLife = () => {
  const [events, setEvents] = useState([]);
  const [links, setLinks] = useState([]);
  const [studentServices, setStudentServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const res = await adminAPI.getCampusContent();
      const data = res.data.data || res.data || {};
      setEvents(data.events || []);
      setLinks(data.links || []);
      setStudentServices(data.studentServices || []);
    } catch (error) {
      toast.error('Failed to load campus content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventChange = (index, field, value) => {
    setEvents((prev) =>
      prev.map((event, i) => (i === index ? { ...event, [field]: value } : event))
    );
  };

  const addEvent = () => {
    setEvents((prev) => [
      ...prev,
      { title: '', date: '', location: '', description: '' }
    ]);
  };

  const removeEvent = (index) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index, field, value) => {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  const addLink = () => {
    setLinks((prev) => [
      ...prev,
      { label: '', type: 'custom', url: '' }
    ]);
  };

  const removeLink = (index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, value) => {
    setStudentServices((prev) =>
      prev.map((service, i) => (i === index ? { ...service, [field]: value } : service))
    );
  };

  const addService = () => {
    setStudentServices((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        ctaLabel: 'Learn more',
        url: '',
        enabled: true
      }
    ]);
  };

  const removeService = (index) => {
    setStudentServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await adminAPI.updateCampusContent({ events, links, studentServices });
      toast.success('Campus content updated successfully');
      fetchContent();
    } catch (error) {
      toast.error('Failed to save campus content');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Campus Life & Events</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Loading campus content...</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              </div>
              <button
                type="button"
                onClick={addEvent}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </button>
            </div>

            <div className="space-y-4">
              {events.length === 0 && (
                <p className="text-sm text-gray-500">No events yet. Add your first event.</p>
              )}
              {events.map((event, index) => (
                <div key={event.id || index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      value={event.title || ''}
                      onChange={(e) => handleEventChange(index, 'title', e.target.value)}
                      placeholder="Event title"
                      className="flex-1 mr-2 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeEvent(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={event.date || ''}
                      onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                      placeholder="Date (e.g. Nov 20)"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={event.location || ''}
                      onChange={(e) => handleEventChange(index, 'location', e.target.value)}
                      placeholder="Location"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={event.description || ''}
                    onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <LinkIcon className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
              </div>
              <button
                type="button"
                onClick={addLink}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </button>
            </div>

            <div className="space-y-4">
              {links.length === 0 && (
                <p className="text-sm text-gray-500">No quick links yet. Add useful resources for students.</p>
              )}
              {links.map((link, index) => (
                <div key={link.id || index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      value={link.label || ''}
                      onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                      placeholder="Link label (e.g. Library Hours)"
                      className="flex-1 mr-2 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={link.type || ''}
                      onChange={(e) => handleLinkChange(index, 'type', e.target.value)}
                      placeholder="Type (library, cafeteria, sports, etc.)"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={link.url || ''}
                      onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                      placeholder="URL (optional)"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <LinkIcon className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Student Services</h3>
            </div>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Service
            </button>
          </div>

          <div className="space-y-4">
            {studentServices.length === 0 && (
              <p className="text-sm text-gray-500">No student services yet. Add services like grocery delivery, tutoring, or discounts.</p>
            )}
            {studentServices.map((service, index) => (
              <div key={service.id || index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <input
                    type="text"
                    value={service.title || ''}
                    onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                    placeholder="Service title (e.g. Grocery Delivery)"
                    className="flex-1 mr-2 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={service.description || ''}
                  onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                  placeholder="Short description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={service.ctaLabel || ''}
                    onChange={(e) => handleServiceChange(index, 'ctaLabel', e.target.value)}
                    placeholder="Button label (e.g. Order Now →)"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={service.url || ''}
                    onChange={(e) => handleServiceChange(index, 'url', e.target.value)}
                    placeholder="Destination URL (optional)"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id={`service-enabled-${index}`}
                    type="checkbox"
                    checked={service.enabled !== false}
                    onChange={(e) => handleServiceChange(index, 'enabled', e.target.checked)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label htmlFor={`service-enabled-${index}`} className="ml-2 text-xs text-gray-600">
                    Service is visible to students
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default AdminCampusLife;
