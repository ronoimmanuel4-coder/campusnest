import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Send, Users, Bell, Mail, Phone, AlertCircle,
  CheckCircle, Clock, Filter, Search, Trash2, Archive, Star,
  MessageCircle, Megaphone, Calendar, User, Globe
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminMessaging = () => {
  const [messages, setMessages] = useState([]);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    channel: 'email',
    priority: 'normal'
  });
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeTab, setActiveTab] = useState('broadcast');

  useEffect(() => {
    fetchMessages();
    fetchSupportTickets();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await adminAPI.getMessages();
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages');
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const response = await adminAPI.getSupportTickets();
      setSupportTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch support tickets');
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await adminAPI.sendBroadcast(broadcastForm);
      toast.success('Broadcast sent successfully');
      setBroadcastForm({
        title: '',
        message: '',
        targetAudience: 'all',
        channel: 'email',
        priority: 'normal'
      });
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send broadcast');
    }
  };

  const replyToTicket = async () => {
    if (!selectedTicket || !replyMessage) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      await adminAPI.replyToTicket(selectedTicket._id, replyMessage);
      toast.success('Reply sent successfully');
      setReplyMessage('');
      fetchSupportTickets();
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const markTicketResolved = async (ticketId) => {
    try {
      await adminAPI.updateTicketStatus(ticketId, 'resolved');
      toast.success('Ticket marked as resolved');
      fetchSupportTickets();
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Messaging & Communication</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'broadcast'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Megaphone className="inline h-5 w-5 mr-2" />
              Broadcast Messages
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'support'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="inline h-5 w-5 mr-2" />
              Support Tickets
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'notifications'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="inline h-5 w-5 mr-2" />
              System Notifications
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Broadcast Tab */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6">
              {/* Broadcast Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Send New Broadcast
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={broadcastForm.title}
                      onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter broadcast title..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Audience
                      </label>
                      <select
                        value={broadcastForm.targetAudience}
                        onChange={(e) => setBroadcastForm({...broadcastForm, targetAudience: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="all">All Users</option>
                        <option value="students">Students Only</option>
                        <option value="landlords">Landlords Only</option>
                        <option value="verified">Verified Users</option>
                        <option value="new">New Users (7 days)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Channel
                      </label>
                      <select
                        value={broadcastForm.channel}
                        onChange={(e) => setBroadcastForm({...broadcastForm, channel: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="push">Push Notification</option>
                        <option value="all">All Channels</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={broadcastForm.priority}
                        onChange={(e) => setBroadcastForm({...broadcastForm, priority: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      value={broadcastForm.message}
                      onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter your message..."
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={sendBroadcast}
                      className="btn-primary flex items-center"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Broadcast
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Broadcasts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Broadcasts
                </h3>
                <div className="space-y-3">
                  {messages.map((msg, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">{msg.title}</h4>
                            {msg.priority === 'urgent' && (
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {msg.audience}
                            </span>
                            <span className="flex items-center">
                              {msg.channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                              {msg.channel === 'sms' && <Phone className="h-3 w-3 mr-1" />}
                              {msg.channel}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(msg.sentAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {msg.deliveryStats?.sent || 0} sent
                          </p>
                          <p className="text-xs text-green-600">
                            {msg.deliveryStats?.delivered || 0} delivered
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tickets List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Support Tickets
                </h3>
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTicket?._id === ticket._id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            From: {ticket.user?.name} ({ticket.user?.email})
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {ticket.message?.substring(0, 100)}...
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ticket.status === 'resolved'
                            ? 'bg-green-100 text-green-600'
                            : ticket.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {ticket.replies?.length || 0} replies
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Details */}
              <div>
                {selectedTicket ? (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Ticket Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Subject</p>
                        <p className="font-medium">{selectedTicket.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Message</p>
                        <p className="mt-1">{selectedTicket.message}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Reply</p>
                        <textarea
                          rows={4}
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter your reply..."
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={replyToTicket}
                          className="btn-primary flex-1"
                        >
                          Send Reply
                        </button>
                        {selectedTicket.status !== 'resolved' && (
                          <button
                            onClick={() => markTicketResolved(selectedTicket._id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a ticket to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      System notifications help keep users informed about important updates,
                      maintenance schedules, and platform changes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { type: 'maintenance', title: 'Scheduled Maintenance', time: '2 hours', status: 'upcoming' },
                  { type: 'update', title: 'Platform Update v2.1', time: '1 day ago', status: 'completed' },
                  { type: 'alert', title: 'Payment Gateway Issue Resolved', time: '3 days ago', status: 'resolved' }
                ].map((notification, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          notification.type === 'maintenance' ? 'bg-yellow-100' :
                          notification.type === 'update' ? 'bg-blue-100' :
                          'bg-green-100'
                        }`}>
                          {notification.type === 'maintenance' && <Clock className="h-5 w-5 text-yellow-600" />}
                          {notification.type === 'update' && <Globe className="h-5 w-5 text-blue-600" />}
                          {notification.type === 'alert' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        notification.status === 'upcoming' ? 'bg-yellow-100 text-yellow-600' :
                        notification.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {notification.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessaging;
