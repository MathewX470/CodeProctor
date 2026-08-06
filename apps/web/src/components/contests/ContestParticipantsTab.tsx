"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getContestMembers, inviteContestMember, removeMember, getContestInvites, cancelInvite } from "@/app/actions/contests";
import { UserPlus, Shield, User, Trash2, Ban, Mail, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export function ContestParticipantsTab({ contest, isAdmin }: { contest: any, isAdmin?: boolean }) {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const [participantEmail, setParticipantEmail] = useState("");
  const [isInvitingParticipant, setIsInvitingParticipant] = useState(false);

  useEffect(() => {
    loadMembersAndInvites();
  }, [contest.id]);

  const loadMembersAndInvites = async () => {
    try {
      const [membersData, invitesData] = await Promise.all([
        getContestMembers(contest.id),
        getContestInvites(contest.id)
      ]);
      setMembers(membersData);
      setInvites(invitesData);
    } catch (err: any) {
      toast.error("Failed to load participants and invites");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent, role: "MODERATOR" | "PARTICIPANT") => {
    e.preventDefault();
    const email = role === "MODERATOR" ? inviteEmail : participantEmail;
    if (!email) return;
    
    if (role === "MODERATOR") setIsInviting(true);
    else setIsInvitingParticipant(true);

    try {
      const res = await inviteContestMember(contest.id, email, role);
      if (res.success) {
        toast.success(`Invitation sent to ${role.toLowerCase()}`);
        if (role === "MODERATOR") setInviteEmail("");
        else setParticipantEmail("");
        loadMembersAndInvites();
        router.refresh();
      } else {
        toast.error(res.error || `Failed to invite ${role.toLowerCase()}`);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      if (role === "MODERATOR") setIsInviting(false);
      else setIsInvitingParticipant(false);
    }
  };

  const handleRemove = async (memberId: string, role: string) => {
    if (!window.confirm(`Are you sure you want to remove this ${role.toLowerCase()}?`)) return;
    
    try {
      const res = await removeMember(contest.id, memberId);
      if (res.success) {
        toast.success("Removed successfully");
        loadMembersAndInvites();
      } else {
        toast.error(res.error || "Failed to remove");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!window.confirm("Are you sure you want to cancel this invitation?")) return;
    try {
      const res = await cancelInvite(inviteId);
      if (res.success) {
        toast.success("Invitation canceled");
        loadMembersAndInvites();
      } else {
        toast.error(res.error || "Failed to cancel invitation");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const moderators = members.filter(m => m.role === "MODERATOR" || m.role === "OWNER");
  const participants = members.filter(m => m.role === "PARTICIPANT");

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading participants...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl pb-10">
      {/* Management Team */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Management Team
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Owners and moderators who can manage problems and monitor the contest.
            </p>
          </div>
          
          <form onSubmit={e => handleInvite(e, "MODERATOR")} className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="email" 
              placeholder="Moderator Email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white w-full md:w-64"
            />
            <button 
              type="submit"
              disabled={isInviting || !inviteEmail}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Add
            </button>
          </form>
        </div>
        
        <ul className="divide-y divide-slate-100 dark:divide-zinc-800/50">
          {moderators.map(mod => (
            <li key={mod.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                  {mod.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-sm">{mod.name}</div>
                  <div className="text-xs text-slate-500">{mod.email}</div>
                </div>
                <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${mod.role === 'OWNER' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                  {mod.role}
                </span>
              </div>
              {mod.role !== "OWNER" && (
                <button 
                  onClick={() => handleRemove(mod.id, mod.role)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove Moderator"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Participants */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-green-500" />
              Participants ({participants.length})
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Users registered to compete in this contest.
            </p>
          </div>
          
          <form onSubmit={e => handleInvite(e, "PARTICIPANT")} className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="email" 
              placeholder="Participant Email"
              value={participantEmail}
              onChange={e => setParticipantEmail(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white w-full md:w-64"
            />
            <button 
              type="submit"
              disabled={isInvitingParticipant || !participantEmail}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
          </form>
        </div>
        
        {participants.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-zinc-400 text-sm">
            No participants have joined yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Participant</th>
                  <th className="px-6 py-3 font-medium">Joined At</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {participants.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-zinc-300">
                      {new Date(p.joinedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {p.isDisqualified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
                          <Ban className="w-3 h-3" /> Disqualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRemove(p.id, p.role)}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove Participant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Pending Invitations */}
      {invites.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-500" />
              Pending Invitations ({invites.length})
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Users who have been invited but have not yet responded.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Invited At</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {invites.map(invite => (
                  <tr key={invite.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${invite.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                        {invite.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-zinc-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(invite.invitedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Cancel Invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
