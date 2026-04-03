package priv.wzw.onw.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class VoteDistributionDTO {
    private String mostVotedPlayer;
    private List<Integer> voteCounts;  // 每个座位得票数
}
