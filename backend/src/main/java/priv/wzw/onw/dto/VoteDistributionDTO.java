package priv.wzw.onw.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class VoteDistributionDTO {
    private String mostVotedPlayer;
    private List<Integer> voteCounts;  // 每个座位得票数
    private List<String> executedPlayers;  // 所有被处决的玩家（平票时多人）
    private boolean villagerWin;  // 村民阵营是否获胜
}
