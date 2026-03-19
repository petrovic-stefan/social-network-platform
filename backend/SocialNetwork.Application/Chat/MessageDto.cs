using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Chat
{
    public sealed record MessageDto(
    int Messages_Id,
    int Conversation_Id,
    int From_Users_Id,
    int? To_Users_Id,
    string Message_Text,
    DateTime Sent_At
    );
}
