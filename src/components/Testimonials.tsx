import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
	{
		quote:
			"It has been great working for this company and I appreciate you and everyone keeping me so busy. Thank you so much! You are all so great!",
		author: "Cheyanne K.",
	},
	{
		quote:
			"Shannon goes above and beyond what is expected of her. She is amazing, and what she did to help us out when in a pinch, was unbelievable. I have never seen another company do that. Top quality customer service for sure.",
		author: "Shelley L., Receptionist",
	},
	{
		quote:
			"Shannon was an asset to our office during our transition. She provided a seamless switch for us, which was greatly appreciated.",
		author: "Tara P., Office Manager, East Side Family & Cosmetic Dentistry",
	},
	{
		quote:
			"This has been the best experience I have ever had with a temp agency. Shannon takes the time to meet you and also makes sure you feel appreciated and are rewarded for going above and beyond!",
		author: "Marianne P., Dental Assistant",
	},
	{
		quote:
			"I had such an awesome experience with DTSS starting the day I signed up with them. They made me feel so welcome! I'm truly excited with their company's vision in the future of dentistry!",
		author: "MarieLisa, Office Manager",
	},
];

export default function TestimonialCarousel() {
	const [current, setCurrent] = useState(0);
	const [visible, setVisible] = useState(true);

	const goTo = useCallback((index: number) => {
		setVisible(false);
		setTimeout(() => {
			setCurrent((index + testimonials.length) % testimonials.length);
			setVisible(true);
		}, 200);
	}, []);

	const next = useCallback(() => goTo(current + 1), [current, goTo]);
	const prev = useCallback(() => goTo(current - 1), [current, goTo]);

	useEffect(() => {
		const timer = setInterval(next, 5000);
		return () => clearInterval(timer);
	}, [next]);

	return (
		<section
			className="w-full py-16 px-6"
			style={{ backgroundColor: "#2a93d1" }}
		>
			<div className="max-w-3xl mx-auto text-center">
				<p className="text-xs font-medium tracking-widest uppercase text-white/70 mb-2">
					Testimonials
				</p>
				<h2 className="text-3xl font-medium text-white mb-12">
					What do our clients think?
				</h2>

				<div className="relative min-h-[200px] flex flex-col items-center justify-center">
					<span className="text-8xl leading-none text-white/20 select-none mb-[-1rem]">
						&ldquo;
					</span>

					<div
						className="transition-opacity duration-300 px-4"
						style={{ opacity: visible ? 1 : 0 }}
					>
						<p className="text-lg text-white leading-relaxed italic mb-6">
							{testimonials[current].quote}
						</p>
						<p className="text-sm text-white/80 font-medium">
							— {testimonials[current].author}
						</p>
					</div>

					<div className="flex items-center justify-center gap-4 mt-10">
						<button
							onClick={prev}
							className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
							aria-label="Previous testimonial"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>

						<div className="flex items-center gap-2">
							{testimonials.map((_, i) => (
								<button
									key={i}
									onClick={() => goTo(i)}
									className="rounded-full transition-all duration-300"
									style={{
										width: i === current ? "10px" : "8px",
										height: i === current ? "10px" : "8px",
										background:
											i === current ? "#ffffff" : "rgba(255,255,255,0.35)",
									}}
									aria-label={`Go to testimonial ${i + 1}`}
								/>
							))}
						</div>

						<button
							onClick={next}
							className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
							aria-label="Next testimonial"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
